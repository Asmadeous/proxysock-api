# frozen_string_literal: true

module Webhooks
  class EsimAccessController < ApplicationController
    skip_before_action :verify_authenticity_token, raise: false
    skip_before_action :update_last_seen_at

    # POST /esim
    def webhook
      # Accept the raw JSON payload — webhook payloads vary by notifyType
      raw = request.body.read
      data = begin
        JSON.parse(raw).with_indifferent_access
      rescue JSON::ParserError
        return render json: { success: false, error: 'Invalid JSON' }, status: :bad_request
      end

      # Log incoming webhook for debugging
      log_webhook(data)

      notify_type = data[:notifyType]

      case notify_type
      when 'CHECK_HEALTH'
        # eSIM Access sends this to verify our endpoint is alive
      when 'ORDER_STATUS'
        process_order_status(data[:content])
      when 'ESIM_STATUS'
        process_esim_status(data[:content])
      when 'SMDP_EVENT'
        process_smdp_event(data[:content])
      when 'DATA_USAGE'
        process_data_usage(data[:content])
      when 'VALIDITY_USAGE'
        process_validity_usage(data[:content])
      else
        Rails.logger.warn("[EsimAccess Webhook] Unknown notifyType: #{notify_type}")
      end
      render json: { success: true }
    end

    private

    # --------------------------------------------------------------------------
    # ORDER_STATUS — eSIM profiles are ready for retrieval
    # Payload: { "orderNo": "B23072016497499", "orderStatus": "GOT_RESOURCE" }
    # --------------------------------------------------------------------------
    def process_order_status(content)
      return unless content.present?

      order_no = content['orderNo']
      return if order_no.blank?

      esim_order = find_esim_order(order_no)
      return unless esim_order

      # Don't re-process already completed orders
      return if %w[completed active].include?(esim_order.status)

      # Fetch the full profile list from eSIM Access API by orderNo
      begin
        client = EsimAccessService.new
        profiles = client.fetch_profiles_by_order(order_no)

        if profiles.blank?
          Rails.logger.warn("[EsimAccess Webhook] No profiles returned for orderNo: #{order_no}")
          return
        end

        # Create Esim records for each profile
        profiles.each do |profile|
          create_esim_from_profile(esim_order, profile)
        end

        # Mark order as completed/active
        esim_order.update!(status: 'completed')
        esim_order.order&.update!(status: 'active')

        # Send credentials to the user/reseller
        deliver_credentials(esim_order)
      rescue StandardError => e
        Rails.logger.error("[EsimAccess Webhook] Failed to process ORDER_STATUS for #{order_no}: #{e.message}")
        Rails.logger.error(e.backtrace.first(5).join("\n"))
      end
    end

    # --------------------------------------------------------------------------
    # ESIM_STATUS — eSIM lifecycle changes (IN_USE, USED_UP, CANCEL, etc.)
    # --------------------------------------------------------------------------
    def process_esim_status(content)
      return unless content.present?

      iccid = content['iccid']
      esim_tran_no = content['esimTranNo']
      return if iccid.blank? && esim_tran_no.blank?

      esim = find_esim(iccid, esim_tran_no)
      return unless esim

      esim.update(
        esim_status: content['esimStatus'],
        smdp_status: content['smdpStatus']
      )

      # Handle specific status changes
      case content['esimStatus']
      when 'CANCEL', 'REVOKED'
        esim.update(status: 'cancelled')
        esim.esim_order&.update(status: 'cancelled') if esim.esim_order&.esims&.all? { |e| e.status == 'cancelled' }
      when 'USED_UP', 'USED_EXPIRED', 'UNUSED_EXPIRED'
        esim.update(status: 'expired')
        esim.esim_order&.update(status: 'expired') if esim.esim_order&.esims&.all? { |e| e.status == 'expired' }
        esim.esim_order&.order&.update(status: 'expired')
      when 'IN_USE'
        esim.update(status: 'active')
      end

      Rails.logger.info("[EsimAccess Webhook] ESIM_STATUS updated: iccid=#{iccid} status=#{content['esimStatus']}")
    end

    # --------------------------------------------------------------------------
    # SMDP_EVENT — Real-time SM-DP+ provisioning lifecycle events
    # --------------------------------------------------------------------------
    def process_smdp_event(content)
      return unless content.present?

      iccid = content['iccid']
      esim_tran_no = content['esimTranNo']
      return if iccid.blank? && esim_tran_no.blank?

      esim = find_esim(iccid, esim_tran_no)
      return unless esim

      esim.update(
        eid: content['eid'].presence || esim.eid,
        smdp_status: content['smdpStatus'],
        esim_status: content['esimStatus'],
        esimaccess_order_no: content['orderNo'].presence || esim.esimaccess_order_no,
        esimaccess_esim_tran_no: content['esimTranNo'].presence || esim.esimaccess_esim_tran_no
      )

      # When SMDP marks as ENABLED, the eSIM has been activated on a device
      if content['smdpStatus'] == 'ENABLED'
        esim.update(status: 'active')
      end

      Rails.logger.info("[EsimAccess Webhook] SMDP_EVENT: iccid=#{iccid} smdpStatus=#{content['smdpStatus']}")
    end

    # --------------------------------------------------------------------------
    # DATA_USAGE — Thresholds at 50%, 80%, 90% data used
    # --------------------------------------------------------------------------
    def process_data_usage(content)
      return unless content.present?

      iccid = content['iccid']
      esim_tran_no = content['esimTranNo']
      return if iccid.blank? && esim_tran_no.blank?

      esim = find_esim(iccid, esim_tran_no)
      return unless esim

      esim.update(
        data_used_bytes: content['orderUsage'],
        data_total_bytes: content['totalVolume']
      )

      Rails.logger.info("[EsimAccess Webhook] DATA_USAGE: iccid=#{iccid} usage=#{content['orderUsage']}/#{content['totalVolume']}")
    end

    # --------------------------------------------------------------------------
    # VALIDITY_USAGE — eSIM is about to expire (1 day remaining)
    # --------------------------------------------------------------------------
    def process_validity_usage(content)
      return unless content.present?

      iccid = content['iccid']
      return if iccid.blank?

      esim = find_esim(iccid, nil)
      return unless esim

      if content['expiredTime'].present?
        esim.update(expires_at: Time.parse(content['expiredTime']))
      end

      Rails.logger.info("[EsimAccess Webhook] VALIDITY_USAGE: iccid=#{iccid} expires=#{content['expiredTime']}")
    end

    # --------------------------------------------------------------------------
    # Helpers
    # --------------------------------------------------------------------------

    def find_esim_order(order_no)
      EsimOrder.find_by(provider_order_no: order_no) ||
        EsimOrder.find_by('api_response::text LIKE ?', "%#{order_no}%")
    end

    def find_esim(iccid, esim_tran_no)
      esim = Esim.find_by(iccid: iccid) if iccid.present?
      esim ||= Esim.find_by(esimaccess_esim_tran_no: esim_tran_no) if esim_tran_no.present?
      esim
    end

    def create_esim_from_profile(esim_order, profile)
      iccid = profile['iccid']
      return if iccid.blank?

      Esim.find_or_create_by(iccid: iccid) do |esim|
        esim.esim_order = esim_order
        esim.esim_provider = 'esim_access'
        esim.smdp_status = profile['smdpStatus'] || 'RELEASED'
        esim.esim_status = profile['esimStatus'] || 'GOT_RESOURCE'
        esim.status = 'active'
        esim.has_phone_number = false

        # eSIM Access profile data
        esim.iccid = iccid
        esim.imsi = profile['imsi']
        esim.msisdn = profile['msisdn']
        esim.eid = profile['eid']
        esim.qr_code_url = profile['qrCodeUrl']
        esim.qr_code_data = profile['ac'] # The LPA activation code string
        esim.activation_code = profile['ac']
        esim.esimaccess_esim_tran_no = profile['esimTranNo']
        esim.esimaccess_order_no = profile['orderNo']
        esim.esimaccess_transaction_id = esim_order.api_response.is_a?(Hash) ? esim_order.api_response['transactionId'] : nil
        esim.data_total_bytes = profile['totalVolume']
        esim.expires_at = profile['expiredTime'].present? ? Time.parse(profile['expiredTime']) : esim_order.duration_days&.days&.from_now
      end
    end

    def deliver_credentials(esim_order)
      order = esim_order.order
      return unless order

      owner = order.orderable
      return unless owner

      # Send email for each eSIM profile
      esim_order.esims.reload.each do |esim|
        saved_esim = esim
        saved_owner = owner
        ActiveRecord.after_all_transactions_commit do
          EsimMailer.with(
            user: saved_owner,
            esim: saved_esim
          ).delivery_email.deliver_later
        end
      end

      # If the owner is a reseller, also dispatch via their webhook endpoints
      if owner.is_a?(Reseller)
        credentials_payload = build_credentials_payload(esim_order)
        saved_owner_id = owner.id
        saved_payload = credentials_payload
        ActiveRecord.after_all_transactions_commit do
          WebhookDispatchWorker.perform_later(saved_owner_id, 'credentials.ready', saved_payload)
        end
      end

      # Create in-app notification
      Notification.create(
        recipient: owner,
        category: 'success',
        title: "eSIM Ready - Order ##{order.order_number}",
        message: "Your eSIM for order ##{order.order_number} is now ready for installation. Check your email for QR code and setup instructions."
      )
    end

    def build_credentials_payload(esim_order)
      order = esim_order.order
      {
        event: 'credentials.ready',
        order_id: order.id,
        order_number: order.order_number,
        product_type: 'esim',
        provider: 'esim_access',
        esims: esim_order.esims.map do |esim|
          {
            iccid: esim.iccid,
            imsi: esim.imsi,
            qr_code_url: esim.qr_code_url,
            activation_code: esim.activation_code,
            smdp_status: esim.smdp_status,
            esim_status: esim.esim_status,
            expires_at: esim.expires_at&.iso8601,
            data_total_bytes: esim.data_total_bytes
          }
        end
      }
    end

    def log_webhook(data)
      ExternalApiWebhook.create(
        provider: 'esim_access',
        webhook_type: data['notifyType'],
        payload: data,
        processing_status: 'processing',
        processed_at: Time.current
      )
    rescue StandardError => e
      Rails.logger.warn("[EsimAccess Webhook] Failed to log webhook: #{e.message}")
    end
  end
end

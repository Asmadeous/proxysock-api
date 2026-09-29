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

      # Saves the profiles, completes the order and sends the credentials (once, even if
      # EsimAccessPollingJob gets there first).
      begin
        unless EsimAccessFulfillmentService.new(esim_order).fulfill!
          Rails.logger.warn("[EsimAccess Webhook] Profiles not allocated yet for orderNo: #{order_no}")
        end
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

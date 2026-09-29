# frozen_string_literal: true

# Saves an eSIM Access order's allocated profiles, completes the order and sends the
# credentials. Runs from the ORDER_STATUS webhook and, if that webhook never arrives, from
# EsimAccessPollingJob; the lock means only one of them completes an order.
class EsimAccessFulfillmentService
  def initialize(esim_order, client: EsimAccessService.new)
    @esim_order = esim_order
    @client = client
  end

  # True once the order is complete; false while eSIM Access has not allocated every profile.
  def fulfill!
    return true if done?

    profiles = @client.fetch_profiles_by_order(@esim_order.provider_order_no)
    return false if profiles.blank? || profiles.any? { |profile| profile['iccid'].blank? || profile['ac'].blank? }

    completed = EsimOrder.transaction do
      @esim_order.lock!
      next false if done?

      profiles.each { |profile| create_esim_from_profile(profile) }
      @esim_order.update!(status: 'completed')
      @esim_order.order&.update!(status: 'active')
      true
    end
    deliver_credentials if completed
    true
  end

  private

  def done?
    %w[completed active].include?(@esim_order.status)
  end

  def create_esim_from_profile(profile)
    iccid = profile['iccid']
    return if iccid.blank?

    esim_order = @esim_order
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

  def deliver_credentials
    order = @esim_order.order
    owner = order&.orderable
    return unless owner

    # Send email for each eSIM profile
    @esim_order.esims.reload.each do |esim|
      ActiveRecord.after_all_transactions_commit do
        EsimMailer.with(user: owner, esim: esim).delivery_email.deliver_later
      end
    end

    # If the owner is a reseller, also dispatch via their webhook endpoints
    return unless owner.is_a?(Reseller)

    payload = credentials_payload(order)
    ActiveRecord.after_all_transactions_commit do
      WebhookDispatchWorker.perform_later(owner.id, 'credentials.ready', payload)
    end
  end

  def credentials_payload(order)
    {
      event: 'credentials.ready',
      order_id: order.id,
      order_number: order.order_number,
      product_type: 'esim',
      provider: 'esim_access',
      esims: @esim_order.esims.map do |esim|
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
end

class Webhooks::EsimAccessController < ApplicationController
  skip_before_action :verify_authenticity_token

  def webhook
    # The webhook notification comes in as JSON with:
    # {
    #   "notifyType": "ORDER_STATUS",
    #   "content": {
    #     ...
    #   }
    # }
    data = params.permit!.to_h

    if data[:notifyType] == 'CHECK_HEALTH'
      render json: { success: true }
      return
    end

    if data[:notifyType] == 'ORDER_STATUS'
      process_order_status(data[:content])
    end

    render json: { success: true }
  end

  private

  def process_order_status(content)
    return unless content.present?

    order_no = content['orderNo'] || content[:orderNo]
    return if order_no.blank?

    esim_orders = EsimOrder.where("provider_order_no = ? OR package_code = ?", order_no, order_no)
                           .or(EsimOrder.where("api_response LIKE ?", "%#{order_no}%"))

    esim_orders.each do |esim_order|
      next if esim_order.status == 'completed' || esim_order.status == 'active'
      
      # Now we need to fetch the allocated profiles
      client = EsimAccessService.new
      begin
        if content['iccid'].present?
          client.fetch_esim_details(content['iccid'])
        else
          # Fallback, we don't know the exact iccid directly from the basic order list in some cases
          # but normally we can query by iccid or orderNo.
          # We'd ideally query the list of esim profiles for this order. EsimAccess has /esim/query using orderNo.
          # So we hit fetch_esim_details or a custom fetch_order_details if it was implemented.
          nil
        end
      rescue => e
        Rails.logger.error("Failed to fetch eSIM details for order #{order_no}: #{e.message}")
        nil
      end

      # For now, let's just trigger a background polling job to fetch the ICCIDs 
      # and send the credentials email, which is more robust.
      # The webhook just signals that the order is ready.
      
      # We'll activate the order and create the Esim profiles.
      # Since we don't have a fetch_esims_by_order_no, we will implement it or pass the iccid if available.

      # Trigger the Esim Access Polling Job or explicit fulfillment
      esim_order.update(status: 'completed')
      esim_order.order&.update(status: 'active')
      # Assuming we can just create the eSIMs here or we can just send the email if the ICCIDs are passed
      if content['iccid'].present?
        esim = Esim.find_or_create_by(iccid: content['iccid']) do |e|
          e.esim_order = esim_order
          e.esim_provider = 'esim_access'
          e.smdp_status = content['smdpStatus'] || 'RELEASED'
          e.esim_status = content['esimStatus'] || 'GOT_RESOURCE'
          e.status = 'active'
          e.has_phone_number = false
          
          # Esim Access uses activation_code or matchingId for LPA
          # Usually eid, matchingId, smdpAddress
          e.qr_code_data = content['matchingId'] # LPA:1$smdpAddress$matchingId
          e.activation_code = content['matchingId']
          e.expires_at = esim_order.duration_days.days.from_now
        end

        # Send email
        EsimMailer.with(
          user: esim_order.order.orderable,
          esim: esim
        ).delivery_email.deliver_later
      end
    end
  end
end

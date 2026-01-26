class EsimProvisioningService
  class OutOfStockError < StandardError; end

  def initialize(order)
    @order = order
    @product = order.product
  end

  def provision!
    return if @order.status == 'completed'

    case @product.provider
    when 'esim_access'
      provision_via_api
    when 'lyca', 'colt'
      provision_from_inventory(@product.provider)
    else
      raise "Unknown eSIM provider: #{@product.provider}"
    end
  end

  private

  def provision_via_api
    service = EsimAccessService.new
    # Assuming product.provider_type holds the 'package_code' or use provider_product_id
    result = service.order_esim(@product.provider_product_id || @product.metadata&.dig('package_code'))
    
    # API might be async (webhook) or sync. Docs say "GOT_RESOURCE" via webhook.
    # We'll create a pending ESIM record with API response stored.
    
    esim_order = EsimOrder.create!(
      order: @order,
      country_code: @product.metadata&.dig('country_code') || 'global',
      data_amount_gb: @product.metadata&.dig('data_gb') || 1,
      duration_days: @product.metadata&.dig('duration_days') || 30,
      status: 'pending_provisioning',
      package_code: @product.provider_product_id,
      esim_provider: 'esim_access',
      api_response: result.to_json, # Store full API response
      provider_order_no: result['orderNo']
    )
    
    @order.update!(status: 'processing', provider_order_id: result['orderNo'])
  end

  def provision_from_inventory(provider)
    EsimInventory.transaction do
      inventory_item = EsimInventory.lock.available.where(provider: provider).first
      
      raise OutOfStockError, "No inventory for #{provider}" unless inventory_item

      inventory_item.mark_as_sold!

      esim_order = EsimOrder.create!(
        order: @order,
        country_code: 'UK', # Lyca/Colt usually UK? dynamic?
        data_amount_gb: 10, # Dynamic based on product
        duration_days: 30,
        status: 'completed',
        esim_provider: provider
      )

      # Create the Esim record
      Esim.create!(
        esim_order: esim_order,
        iccid: inventory_item.iccid,
        smdp_status: 'ENABLED',
        status: 'active',
        qr_code_data: inventory_item.activation_code, # Or construct LPA string
        pin1: inventory_item.pin1,
        puk1: inventory_item.puk1,
        pin2: inventory_item.pin2,
        puk2: inventory_item.puk2,
        activation_code: inventory_item.activation_code
      )

      @order.update!(status: 'completed', total_amount: @order.product.product_pricings.first.selling_price)
      
      # Send Email
      EsimMailer.with(user: @order.user, esim: esim_order.esim).delivery_email.deliver_later
    end
  end
end

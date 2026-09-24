# frozen_string_literal: true

class EsimProvisioningService
  def initialize(order)
    @order   = order
    @product = order.product
  end

  def provision!
    return if @order.status == 'completed'

    case @product.provider
    when 'esim_access'
      provision_via_api
    when 'meisim'
      MeisimOrderService.new(@order).place!
    else
      raise "Unknown eSIM provider: #{@product.provider}"
    end
  end

  private

  # --------------------------------------------------------------------------
  # API-based provisioning (eSIM Access — data-only)
  # --------------------------------------------------------------------------
  def provision_via_api
    service = EsimAccessService.new
    result  = service.order_esim(@product.provider_product_id || @product.metadata&.dig('package_code'))

    EsimOrder.create!(
      order: @order,
      country_code: @product.metadata&.dig('country_code') || 'global',
      data_amount_gb: @product.metadata&.dig('data_gb') || 1,
      duration_days: @product.metadata&.dig('duration_days') || 30,
      status: 'pending_provisioning',
      package_code: @product.provider_product_id,
      esim_provider: 'esim_access',
      esim_type: 'data_only',
      moq_quantity: 1,
      api_response: result.to_json,
      provider_order_no: result['orderNo'],
      metadata: {
        'auto_renew' => @order.metadata&.dig('auto_renew'),
        'renewal_method' => @order.metadata&.dig('payment_debug')
      }.compact
    )

    # The eSIM Access API processes orders asynchronously — the order stays
    # in 'processing' until their webhook (or a polling job) confirms
    # provisioning is complete and QR codes are available.
    # EsimAccessWebhookJob / polling is responsible for transitioning to 'active'.
    @order.update!(status: 'processing', provider_order_id: result['orderNo'])

    # Schedule a polling job to check provisioning status and activate when ready.
    # This is a safety net in case the webhook is missed.
    EsimAccessPollingJob.perform_in(5.minutes, @order.id) if defined?(EsimAccessPollingJob)
  end
end

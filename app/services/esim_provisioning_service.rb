# frozen_string_literal: true

class EsimProvisioningService
  class OutOfStockError < StandardError; end
  class MoqViolationError < StandardError; end

  def initialize(order)
    @order   = order
    @product = order.product
  end

  def provision!
    return if @order.status == 'completed'

    provider  = @product.provider
    esim_type = @product.metadata&.dig('esim_type') || 'data_only'
    quantity  = @order.quantity || 1

    case provider
    when 'esim_access'
      provision_via_api
    when 'lyca', 'colt', *inventory_providers
      enforce_moq!(provider, quantity)
      provision_from_inventory(provider, esim_type: esim_type, quantity: quantity)
    else
      raise "Unknown eSIM provider: #{provider}"
    end
  end

  private

  # All known inventory-backed providers.
  # Extend this list as new providers are added via the admin.
  def inventory_providers
    EsimInventory.distinct.pluck(:provider) - %w[esim_access]
  end

  # Raises MoqViolationError if the requested quantity is below the provider's MOQ.
  def enforce_moq!(provider, quantity)
    moq = EsimInventory.moq_for(provider)
    return if quantity >= moq

    raise MoqViolationError,
          "Minimum order quantity for #{provider} is #{moq} line(s). Requested: #{quantity}."
  end

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
        'auto_renew' => @order.metadata['auto_renew'],
        'renewal_method' => @order.metadata['payment_debug']
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

  # --------------------------------------------------------------------------
  # Inventory-based provisioning (Lyca, Colt, Lebara, etc.)
  # Supports both data_only and voice_data_sms eSIM types.
  # Provisions `quantity` lines in a single DB transaction.
  # --------------------------------------------------------------------------
  def provision_from_inventory(provider, esim_type:, quantity: 1)
    EsimInventory.transaction do
      # Lock and reserve exactly `quantity` items atomically to prevent overselling.
      items = EsimInventory
              .lock
              .available
              .by_provider(provider)
              .where(esim_type: esim_type)
              .limit(quantity)
              .to_a

      if items.size < quantity
        raise OutOfStockError,
              "Insufficient stock for #{provider} (#{esim_type}). " \
              "Requested: #{quantity}, available: #{items.size}."
      end

      # Derive plan metadata from the product
      country_code   = @product.metadata&.dig('country_code') || 'global'
      data_amount_gb = @product.metadata&.dig('data_gb') || 0
      duration_days  = @product.metadata&.dig('duration_days') || 30

      esim_order = EsimOrder.create!(
        order: @order,
        country_code: country_code,
        data_amount_gb: data_amount_gb,
        duration_days: duration_days,
        status: 'completed',
        esim_provider: provider,
        esim_type: esim_type,
        moq_quantity: quantity,
        metadata: {
          'auto_renew' => @order.metadata['auto_renew'],
          'renewal_method' => @order.metadata['payment_debug']
        }.compact
      )

      # Provision one Esim record per inventory item
      items.each do |item|
        item.mark_as_sold!

        Esim.create!(
          esim_order: esim_order,
          esim_provider: provider,
          iccid: item.iccid,
          smdp_status: 'ENABLED',
          esim_status: 'active',
          status: 'active',
          has_phone_number: esim_type == 'voice_data_sms',
          qr_code_url: item.qr_code_url,
          qr_code_data: item.activation_code, # LPA activation string
          activation_code: item.activation_code,
          pin1: item.pin1,
          puk1: item.puk1,
          expires_at: duration_days.days.from_now
        )
      end

      # Preserve the total_amount already calculated by PricingService/OrderProvisioningService.
      # Overwriting it here would bypass reseller discounts and infrastructure surcharges.
      @order.update!(status: 'active')

      # Notify the customer / reseller
      esim_order.esims.each do |esim|
        EsimMailer.with(
          user: @order.orderable,
          esim: esim
        ).delivery_email.deliver_later
      end
    end
  end
end

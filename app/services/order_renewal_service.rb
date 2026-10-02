# frozen_string_literal: true

class OrderRenewalService
  def initialize(order, user_or_reseller)
    @order = order
    @actor = user_or_reseller
    @wallet = @actor.wallet
  end

  def process!
    return renew_with_provider! if @order.product.provider_type == 'myproxyapi'

    raise 'Order cannot be renewed' unless can_renew?

    ActiveRecord::Base.transaction do
      # Calculate renewal cost (assume same as original selling price for now)
      # Could be enhanced with specific renewal pricing
      cost = @order.product_pricing.selling_price

      # Handle Reseller Surcharge
      cost = (cost * @actor.price_multiplier).round(2) if @actor.is_a?(Reseller)

      # Deduct balance
      @wallet.debit!(cost, "Order ##{@order.id} Renewal", { order_id: @order.id })

      # Delegate renewal logic to resource
      resource = @order.provisioned_resource
      resource.renew!

      # Update Order status if needed (e.g. if it was expired)
      @order.update!(status: 'active') if @order.status == 'expired'

      # Send notification
      # NotificationService.notify_renewal(@order)
    end

    true
  end

  def can_renew?
    resource = @order.provisioned_resource
    resource.respond_to?(:can_renew?) && resource.can_renew?
  end

  private

  # MyProxyAPI orders are extended at the provider (paid from our deposit) inside the
  # wallet debit's transaction, so a refused extension charges the customer nothing.
  def renew_with_provider!
    raise 'Order cannot be renewed' unless %w[active expired].include?(@order.status)

    cost = @order.product_pricing.selling_price
    cost = (cost * @actor.price_multiplier).round(2) if @actor.is_a?(Reseller)

    ActiveRecord::Base.transaction do
      @wallet.debit!(cost, "Order ##{@order.order_number} Renewal", { order_id: @order.id })
      ProxyManagementService.new(@order).extend!
      @order.update!(status: 'active') if @order.status == 'expired'
    end
    true
  end
end

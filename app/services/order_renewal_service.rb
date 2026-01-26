class OrderRenewalService
  def initialize(order, user_or_reseller)
    @order = order
    @actor = user_or_reseller
    @wallet = @actor.wallet
  end
  
  def process!
    raise "Order cannot be renewed" unless can_renew?
    
    ActiveRecord::Base.transaction do
      # Calculate renewal cost (assume same as original selling price for now)
      # Could be enhanced with specific renewal pricing
      cost = @order.product_pricing.selling_price
      
      # Handle Reseller Surcharge
      if @actor.is_a?(Reseller)
        cost = (cost * @actor.price_multiplier).round(2)
      end
      
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
    resource && resource.can_renew?
  end
end

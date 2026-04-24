# frozen_string_literal: true

class ResellerEarningsService
  def self.record_profit_share!(order)
    actor = order.orderable
    reseller = nil

    if actor.is_a?(Reseller)
      reseller = actor
    elsif actor.is_a?(User) && actor.reseller_id.present?
      reseller = actor.reseller
    end

    return unless reseller

    pricing = order.product_pricing
    
    # Reseller's wholesale cost
    reseller_cost = (pricing&.reseller_selling_price.to_f || 0) * order.quantity
    
    # Reseller earns whatever they charged their sub-user minus their wholesale cost
    commission = [0, order.total_amount - reseller_cost].max.round(2)

    return if commission <= 0

    # Credit earnings wallet
    wallet = reseller.earnings_wallet || reseller.create_earnings_wallet!(wallet_type: 'earnings')

    wallet.credit!(
      commission,
      "Profit share — order ##{order.id} (from #{actor.is_a?(User) ? "user #{actor.email}" : 'self'})",
      { order_id: order.id, source_actor_id: actor.id, source_actor_type: actor.class.name }
    )
  end
end

# frozen_string_literal: true

class ResellerEarningsService
  def self.record_profit_share!(order)
    actor = order.orderable
    reseller = nil

    if actor.is_a?(Reseller)
      reseller = actor if actor.infrastructure?
    elsif actor.is_a?(User) && actor.reseller_id.present?
      reseller = actor.reseller if actor.reseller&.infrastructure?
    end

    return unless reseller&.infrastructure?

    order.product_pricing

    # Infrastructure resellers get GROSS revenue in real-time.
    # We manage everything and they pay a negotiated cost at month-end.
    commission = order.total_amount

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

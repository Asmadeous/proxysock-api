# frozen_string_literal: true

class FundSplitterService
  # Calculates and records the fund split for an order.
  # Should be called after an order is fully paid and provisioned.
  def self.process_order!(order)
    return if order.order_fund_split.present?

    total_amount = order.product_pricing.selling_price * order.quantity
    capital_amount = calculate_capital(order)
    profit_amount = [total_amount - capital_amount, 0].max

    OrderFundSplit.create!(
      order: order,
      total_amount: total_amount,
      capital_amount: capital_amount,
      profit_amount: profit_amount,
      status: 'pending'
    )
  end

  def self.calculate_capital(order)
    product = order.product
    quantity = order.quantity

    case product.product_type
    when 'vps', 'rdp', 'cloud_vps'
      # Virtual Machines (VPS / RDP): Capital is 15% of total purchase price
      (order.product_pricing.selling_price * quantity * 0.15).round(2)
    when 'usa_esim'
      # USA eSIMs (Lyca): Capital is Fixed $13.00 per item
      (13.00 * quantity).to_d
    else
      # Proxies, VPNs, Global eSIMs (API-Centered): Capital is the base API price
      ((order.product_pricing.api_price || 0) * quantity).to_d
    end
  end
end

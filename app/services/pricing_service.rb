# frozen_string_literal: true

class PricingService
  def initialize(actor, product, pricing, quantity: 1, metadata: {})
    @actor = actor
    @product = product
    @pricing = pricing
    @quantity = quantity.to_i
    @metadata = metadata || {}
  end

  def calculate_total
    base_price = if reseller?
                   @pricing.reseller_selling_price || @pricing.selling_price
                 elsif user?
                   @pricing.user_selling_price || @pricing.selling_price
                 else
                   @pricing.selling_price
                 end

    # Global ISP: the selling_price is a per-proxy range price (e.g. $8.18 for 10-19 qty).
    # Total = quantity_of_proxies × per_proxy_range_price. Duration is baked into the
    # plan selection on the provider side (period sent separately to MyProxyApi), so we
    # must NOT multiply by period/duration here.
    if global_isp?
      validate_global_isp_quantity!
      total = base_price * @quantity
    else
      # For other products, duration/period acts as a multiplier:
      #   Static IPs:  period = months (1, 3, 6, 12)
      #   Residential: period = GB amount
      #   Mobile:      period = days
      effective_quantity = @quantity * duration_multiplier
      total = base_price * effective_quantity
    end

    # Apply actor-specific adjustments
    total = apply_reseller_multiplier(total) if reseller?
    total = apply_user_discounts(total) if user?
    total = apply_affiliate_discount(total)

    total.round(2)
  end

  private

  def apply_affiliate_discount(amount)
    # Only apply if there is a pending referral for this actor
    referral = @actor.affiliate_referrals.pending.first
    return amount unless referral

    discount_pct = referral.affiliate.discount_rate / 100.0
    amount * (1.0 - discount_pct)
  end

  def duration_multiplier
    # For some products, duration is passed as 'period' (months) or 'duration_days'
    # For Global ISP, period is a string like '30d' or '7d' and should NOT be used as a multiplier
    # as the price is already for that specific period.
    return 1 if global_isp?

    if @metadata['period'].present?
      period = @metadata['period'].to_s
      # If period contains 'd' (like '30d'), it's a fixed period package, multiplier is 1
      return 1 if period.include?('d')

      period.to_i
    elsif @metadata['duration_days'].present?
      # If pricing is monthly but duration is in days, calculate monthly fraction or just use days as multiplier if duration_type is day
      if @pricing.duration_type == 'month'
        (@metadata['duration_days'].to_f / 30.0).ceil
      else
        @metadata['duration_days'].to_i
      end
    else
      1
    end
  end

  def global_isp?
    @product.product_type == 'global_isp' || @product.product_category&.slug == 'global-isp'
  end

  def validate_global_isp_quantity!
    qty_min = @product.metadata&.dig('qty_min')
    qty_max = @product.metadata&.dig('qty_max')

    return unless qty_min.present? && qty_max.present?

    return unless @quantity < qty_min.to_i || @quantity > qty_max.to_i

    raise ArgumentError,
          "Quantity #{@quantity} is outside the valid range (#{qty_min}-#{qty_max}) for product '#{@product.name}'. " \
          'Please select the correct tier for your desired quantity.'
  end

  def apply_reseller_multiplier(amount)
    amount * @actor.price_multiplier
  end

  def apply_user_discounts(amount)
    # Check for direct discount in user metadata
    discount = @actor.metadata && @actor.metadata['discount_percentage']
    return amount if discount.blank?

    amount * (1.0 - (discount.to_f / 100.0))
  end

  def reseller?
    @actor.is_a?(Reseller)
  end

  def user?
    @actor.is_a?(User)
  end
end

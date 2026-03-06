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

    # Calculate effective quantity based on duration/period if present in metadata
    effective_quantity = @quantity * duration_multiplier

    total = base_price * effective_quantity

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
    if @metadata['period'].present?
      @metadata['period'].to_i
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

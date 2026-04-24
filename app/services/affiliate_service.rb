# frozen_string_literal: true

# Orchestrates all affiliate program business logic:
# - Applying referral discounts at checkout
# - Recording commissions when orders complete
# - Handling payout requests
class AffiliateService
  class InsufficientBalanceError < StandardError; end
  class AlreadyEnrolledError     < StandardError; end

  def initialize(entity = nil)
    @entity = entity
  end

  def self.halted?
    false
  end

  # ─────────────────────────────────────
  # Enrolment
  # ─────────────────────────────────────

  def enrol!(commission_rate: nil, discount_rate: nil)
    return if self.class.halted?
    raise AlreadyEnrolledError, "#{@entity.class} is already an affiliate" if @entity.affiliate.present?

    Affiliate.create!(
      affiliatable: @entity,
      commission_rate: commission_rate || default_commission_rate,
      discount_rate: discount_rate || default_discount_rate
    )
  end

  # ─────────────────────────────────────
  # Referral tracking
  # ─────────────────────────────────────

  # Call at sign-up when a referral code is present.
  # Returns the AffiliateReferral record or nil if code is invalid.
  def self.track_signup!(referred_entity, code)
    affiliate = Affiliate.find_by(referral_code: code)
    return nil unless affiliate

    affiliate.affiliate_referrals.create!(referred: referred_entity)
  end

  # ─────────────────────────────────────
  # Discount Application
  # ─────────────────────────────────────

  # Apply the referral discount to an order for a first-time referred customer.
  # Returns the discount amount (0 if not applicable).
  def self.apply_discount!(order)
    entity   = order.orderable
    referral = entity.affiliate_referrals.pending.first
    return 0 unless referral

    affiliate     = referral.affiliate
    discount_pct  = affiliate.discount_rate / 100.0
    discount_amt  = (order.total_amount * discount_pct).round(2)

    order.update!(total_amount: order.total_amount - discount_amt)
    referral.update!(referee_discount_applied: discount_amt)

    discount_amt
  end

  # ─────────────────────────────────────
  # Commission Recording
  # ─────────────────────────────────────

  # Call after an order completes provisioning to credit the affiliate.
  def self.record_commission!(order)
    return if halted?

    entity = order.orderable
    
    # 1. Did the user manually enter an affiliate code at checkout?
    explicit_code = order.metadata&.dig('promo_code')
    explicit_affiliate = nil
    if explicit_code.present?
      explicit_affiliate = Affiliate.active.find_by('UPPER(referral_code) = ?', explicit_code.upcase)
    end

    # 2. Does the user have a pending signup referral?
    pending_referral = entity.respond_to?(:affiliate_referrals) ? entity.affiliate_referrals.pending.first : nil

    # Prioritize explicitly entered code at checkout, fallback to signup referral
    affiliate = explicit_affiliate || pending_referral&.affiliate
    return unless affiliate

    # Calculate commission based on the affiliate's exact commission_rate percentage
    rate = affiliate.commission_rate.to_f / 100.0
    commission = (order.total_amount * rate).round(2)

    # Process Referral Record
    if pending_referral && pending_referral.affiliate_id == affiliate.id
      # We are converting the implicitly tracked signup referral
      pending_referral.update!(commission_amount: commission)
      pending_referral.convert!(order)
    else
      # User explicitly typed an affiliate code at checkout (or it's the 2nd time).
      # Create a new direct converted referral so the affiliate gets paid for this order.
      AffiliateReferral.create!(
        affiliate:       affiliate,
        referred:        entity,
        order:           order,
        status:          'converted',
        converted_at:    Time.current,
        commission_amount: commission,
        referee_discount_applied: order.metadata&.dig('promo_discount').to_f
      )
      affiliate.increment!(:total_earned, commission)
    end

    # Credit earnings wallet (only for linked affiliates with a platform account)
    owner = affiliate.affiliatable
    if owner.present?
      wallet = owner.earnings_wallet || owner.create_earnings_wallet!(wallet_type: 'earnings')
      wallet.credit!(commission, "Affiliate commission — order ##{order.id}", { order_id: order.id })
    end
    # For standalone affiliates, the commission is tracked in total_earned
    # and paid out manually via the admin payout flow
  end

  # ─────────────────────────────────────
  # Payouts
  # ─────────────────────────────────────

  # Request a payout for the current entity's affiliate account.
  # Crypto payouts are dispatched automatically; non-crypto go to admin for manual processing.
  def request_payout!(amount:, method: 'wallet', details: {})
    affiliate = @entity.affiliate
    raise 'Not enrolled in affiliate program' unless affiliate

    payout = nil
    affiliate.with_lock do
      raise InsufficientBalanceError, 'Insufficient pending balance' if affiliate.pending_balance < amount

      # Wallet payouts are instant internal transfers
      if method == 'wallet'
        owner = affiliate.affiliatable
        raise 'Standalone affiliates cannot payout to internal wallet' unless owner

        payout = AffiliatePayout.create!(
          affiliate: affiliate,
          amount: amount,
          payment_method: 'wallet',
          payment_details: details,
          status: 'processing'
        )

        wallet = owner.main_wallet || owner.create_main_wallet!(wallet_type: 'main')
        wallet.credit!(amount, "Affiliate payout ##{payout.id}")
        payout.mark_paid!
        return payout
      end

      # Crypto payouts are auto-dispatched
      if method == 'crypto'
        address = details['crypto_address']
        currency = details['crypto_currency'] || 'USDT'
        raise 'Missing crypto_address in payment details' if address.blank?

        payout = AffiliatePayout.create!(
          affiliate: affiliate,
          amount: amount,
          payment_method: 'crypto',
          payment_details: details,
          status: 'processing'
        )

        begin
          PlisioService.new.withdraw(payout.amount, currency, address, "AFF-#{payout.id}-#{SecureRandom.hex(2)}")
          payout.update!(metadata: { gateway: 'plisio' })
          payout.mark_paid!
        rescue StandardError => e
          payout.update!(status: 'failed', metadata: { error: e.message })
          raise e
        end

        return payout
      end

      # All other methods (manual) → create pending payout and notify admin
      payout = AffiliatePayout.create!(
        affiliate: affiliate,
        amount: amount,
        payment_method: method.presence || 'manual',
        payment_details: details,
        status: 'pending'
      )

      # Notify admin for manual processing
      begin
        AdminMailer.affiliate_payout_request(payout).deliver_later
      rescue StandardError => e
        Rails.logger.error("Failed to notify admin for affiliate payout #{payout.id}: #{e.message}")
      end
    end

    payout
  end

  private

  def default_commission_rate
    @entity.is_a?(Reseller) ? 12.0 : 10.0
  end

  def default_discount_rate
    5.0
  end
end

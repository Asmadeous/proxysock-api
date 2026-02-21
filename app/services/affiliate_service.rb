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

  # ─────────────────────────────────────
  # Enrolment
  # ─────────────────────────────────────

  # Enrol a User or Reseller into the affiliate program.
  def enrol!
    raise AlreadyEnrolledError, "#{@entity.class} is already an affiliate" if @entity.affiliate.present?

    Affiliate.create!(
      affiliatable:    @entity,
      commission_rate: default_commission_rate,
      discount_rate:   default_discount_rate
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
    entity   = order.orderable
    referral = entity.affiliate_referrals.pending.first
    return unless referral

    referral.convert!(order)

    # Optionally credit wallet if the affiliate prefers wallet payouts
    wallet = referral.affiliate.affiliatable.wallet
    if wallet
      wallet.credit!(referral.commission_amount,
                     description: "Affiliate commission — order ##{order.id}")
    end
  end

  # ─────────────────────────────────────
  # Payouts
  # ─────────────────────────────────────

  # Request a payout for the current entity's affiliate account.
  def request_payout!(amount:, method: 'wallet', details: {})
    affiliate = @entity.affiliate
    raise "Not enrolled in affiliate program" unless affiliate
    raise InsufficientBalanceError, "Insufficient pending balance" if affiliate.pending_balance < amount

    AffiliatePayout.create!(
      affiliate:       affiliate,
      amount:          amount,
      payment_method:  method,
      payment_details: details
    )
  end

  # Admin: process a pending payout.
  def self.process_payout!(payout)
    raise "Payout already processed" unless payout.status == 'pending'

    payout.update!(status: 'processing')

    if payout.payment_method == 'wallet'
      wallet = payout.affiliate.affiliatable.wallet
      wallet.credit!(payout.amount, description: "Affiliate payout ##{payout.id}")
    end

    payout.mark_paid!
  end

  private

  def default_commission_rate
    @entity.is_a?(Reseller) ? 12.0 : 10.0
  end

  def default_discount_rate
    5.0
  end
end

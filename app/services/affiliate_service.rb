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

    entity   = order.orderable
    referral = entity.affiliate_referrals.pending.first
    return unless referral

    pricing = order.product_pricing
    api_cost = pricing.api_price.to_f * order.quantity
    profit = order.total_amount - api_cost
    commission = [0, profit / 2.0].max.round(2)

    referral.update!(commission_amount: commission)
    referral.convert!(order)

    # Credit earnings wallet
    owner = referral.affiliate.affiliatable
    wallet = owner.earnings_wallet || owner.create_earnings_wallet!(wallet_type: 'earnings')

    wallet.credit!(commission, "Affiliate commission — order ##{order.id}", { order_id: order.id })
  end

  # ─────────────────────────────────────
  # Payouts
  # ─────────────────────────────────────

  # Request a payout for the current entity's affiliate account.
  def request_payout!(amount:, method: 'wallet', details: {})
    affiliate = @entity.affiliate
    raise 'Not enrolled in affiliate program' unless affiliate
    raise InsufficientBalanceError, 'Insufficient pending balance' if affiliate.pending_balance < amount

    AffiliatePayout.create!(
      affiliate: affiliate,
      amount: amount,
      payment_method: method,
      payment_details: details,
      status: 'pending'
    )
  end

  # Transfer balance from earnings wallet to main wallet
  def transfer_to_main_wallet!(amount)
    main_wallet = @entity.main_wallet || @entity.create_main_wallet!(wallet_type: 'main')
    earnings_wallet = @entity.earnings_wallet

    raise 'No earnings wallet found' unless earnings_wallet
    raise InsufficientBalanceError, 'Insufficient earnings balance' if earnings_wallet.balance < amount

    ActiveRecord::Base.transaction do
      earnings_wallet.debit!(amount, 'Transfer to main wallet', { target: 'main_wallet' })
      main_wallet.credit!(amount, 'Transfer from earnings wallet', { source: 'earnings_wallet' })
    end
  end

  # Admin: process a pending payout.
  def self.process_payout!(payout)
    raise 'Payout already processed' unless payout.status == 'pending'

    payout.update!(status: 'processing')

    begin
      case payout.payment_method
      when 'wallet'
        wallet = payout.affiliate.affiliatable.main_wallet || payout.affiliate.affiliatable.create_main_wallet!(wallet_type: 'main')
        wallet.credit!(payout.amount, "Affiliate payout ##{payout.id}")
        payout.mark_paid!
      when 'bank_transfer'
        # Integration with Paystack Transfer
        # PaystackService.new.initiate_transfer(payout)
        payout.update!(status: 'processing', metadata: { gateway: 'paystack' })
        # For now, mark as paid if mock or automated
        payout.mark_paid!
      when 'crypto'
        # Integration with Plisio or Payvra
        # PlisioService.new.withdraw(payout)
        payout.update!(status: 'processing', metadata: { gateway: 'plisio' })
        payout.mark_paid!
      else
        raise "Unsupported payout method: #{payout.payment_method}"
      end
    rescue StandardError => e
      payout.update!(status: 'failed', metadata: { error: e.message })
      raise e
    end
  end

  private

  def default_commission_rate
    @entity.is_a?(Reseller) ? 12.0 : 10.0
  end

  def default_discount_rate
    5.0
  end
end

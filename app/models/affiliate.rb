# frozen_string_literal: true

class Affiliate < ApplicationRecord
  belongs_to :affiliatable, polymorphic: true, optional: true
  has_many   :affiliate_referrals, dependent: :destroy
  has_many   :affiliate_payouts,   dependent: :destroy

  STATUSES = %w[active suspended pending_payout].freeze

  validates :referral_code,   presence: true, uniqueness: true
  validates :commission_rate, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validates :discount_rate,   numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validates :status,          inclusion: { in: STATUSES }

  # Standalone affiliates must have name and email
  validates :name,  presence: true, if: :standalone?
  validates :email, presence: true, if: :standalone?

  # Ensure referral codes don't collide with promo codes
  validate :referral_code_not_promo_code, on: :create

  before_validation :generate_referral_code, on: :create

  scope :active,        -> { where(status: 'active') }
  scope :standalone,    -> { where(affiliatable_type: nil) }
  scope :for_user,      -> { where(affiliatable_type: 'User') }
  scope :for_reseller,  -> { where(affiliatable_type: 'Reseller') }

  # Is this a standalone affiliate (not linked to a User or Reseller)?
  def standalone?
    affiliatable_type.blank?
  end

  # Unified display name — works for standalone + linked affiliates
  def display_name
    if standalone?
      name
    elsif affiliatable.respond_to?(:company_name) && affiliatable.company_name.present?
      affiliatable.company_name
    elsif affiliatable.respond_to?(:first_name)
      "#{affiliatable.first_name} #{affiliatable.last_name}"
    else
      name || 'Unknown'
    end
  end

  # Unified display email — works for standalone + linked affiliates
  def display_email
    if standalone?
      email
    elsif affiliatable.respond_to?(:email)
      affiliatable.email
    else
      email
    end
  end

  # Calculate discount for a given order amount (mirrors PromoCode interface)
  # Affiliate discount is always percentage-based using discount_rate
  def calculate_discount(order_amount)
    return 0 unless status == 'active'
    return 0 if discount_rate.to_f <= 0

    discount = order_amount * (discount_rate.to_f / 100.0)
    [discount, order_amount].min.round(2)
  end

  # Pending balance not yet paid out, accounting for inflight requests
  def pending_balance
    inflight = affiliate_payouts.where(status: %w[pending processing]).sum(:amount)
    total_earned - total_paid_out - inflight
  end

  # Full referral link
  def referral_url
    "#{Rails.application.config.frontend_url}/register?ref=#{referral_code}"
  end

  private

  def generate_referral_code
    return if referral_code.present?

    loop do
      code = SecureRandom.alphanumeric(10).upcase
      self.referral_code = code
      break unless Affiliate.exists?(referral_code: code) || PromoCode.exists?(code: code)
    end
  end

  def referral_code_not_promo_code
    return unless referral_code.present?

    if PromoCode.where('UPPER(code) = ?', referral_code.upcase).exists?
      errors.add(:referral_code, 'conflicts with an existing promo code')
    end
  end
end

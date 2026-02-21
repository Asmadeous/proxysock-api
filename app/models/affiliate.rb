# frozen_string_literal: true

class Affiliate < ApplicationRecord
  belongs_to :affiliatable, polymorphic: true
  has_many   :affiliate_referrals, dependent: :destroy
  has_many   :affiliate_payouts,   dependent: :destroy

  STATUSES = %w[active suspended pending_payout].freeze

  validates :referral_code,   presence: true, uniqueness: true
  validates :commission_rate, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validates :discount_rate,   numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validates :status,          inclusion: { in: STATUSES }

  before_validation :generate_referral_code, on: :create

  scope :active,   -> { where(status: 'active') }
  scope :for_user, -> { where(affiliatable_type: 'User') }
  scope :for_reseller, -> { where(affiliatable_type: 'Reseller') }

  # Pending balance not yet paid out
  def pending_balance
    total_earned - total_paid_out
  end

  # Full referral link
  def referral_url
    "#{Rails.application.config.frontend_url}?ref=#{referral_code}"
  end

  private

  def generate_referral_code
    return if referral_code.present?

    loop do
      code = SecureRandom.alphanumeric(10).upcase
      self.referral_code = code
      break unless Affiliate.exists?(referral_code: code)
    end
  end
end

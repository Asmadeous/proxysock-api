# frozen_string_literal: true

class AffiliatePayout < ApplicationRecord
  belongs_to :affiliate

  STATUSES         = %w[pending processing paid failed].freeze
  PAYMENT_METHODS  = %w[wallet crypto manual].freeze

  # Supported crypto currencies for affiliate payouts
  CRYPTO_CURRENCIES = %w[BTC USDC ETH USDT].freeze

  validates :amount,         numericality: { greater_than: 0 }
  validates :status,         inclusion: { in: STATUSES }
  validates :payment_method, inclusion: { in: PAYMENT_METHODS }, allow_nil: true

  scope :pending,    -> { where(status: 'pending') }
  scope :processing, -> { where(status: 'processing') }
  scope :paid,       -> { where(status: 'paid') }

  def mark_paid!(paid_at: Time.current)
    update!(status: 'paid', paid_at: paid_at)
    affiliate.increment!(:total_paid_out, amount)
    affiliate.update!(last_payout_at: paid_at)
  end

  def crypto?
    payment_method == 'crypto'
  end

  def requires_manual_review?
    payment_method == 'manual' && status == 'pending'
  end
end

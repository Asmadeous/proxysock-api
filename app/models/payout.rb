# frozen_string_literal: true

class Payout < ApplicationRecord
  belongs_to :reseller

  GATEWAYS = %w[paystack plisio payvra hundredpay manual].freeze
  STATUSES = %w[pending processing completed failed].freeze

  # Crypto gateways are auto-dispatched; others are manually processed by admin
  CRYPTO_GATEWAYS = %w[plisio payvra].freeze

  # Supported crypto currencies for withdrawal
  CRYPTO_CURRENCIES = %w[BTC USDC ETH USDT].freeze

  validates :amount, numericality: { greater_than: 0 }
  validates :gateway, inclusion: { in: GATEWAYS }
  validates :status, inclusion: { in: STATUSES }

  before_create :generate_reference

  scope :pending, -> { where(status: 'pending') }
  scope :processing, -> { where(status: 'processing') }
  scope :completed, -> { where(status: 'completed') }
  scope :failed, -> { where(status: 'failed') }
  scope :manual_review, -> { where(gateway: GATEWAYS - CRYPTO_GATEWAYS, status: 'pending') }

  def mark_completed!(response = {})
    update!(status: 'completed', gateway_response: response, completed_at: Time.current)
  end

  def mark_failed!(response = {})
    update!(status: 'failed', gateway_response: response)
  end

  def crypto?
    CRYPTO_GATEWAYS.include?(gateway)
  end

  def requires_manual_review?
    !crypto? && status == 'pending'
  end

  private

  def generate_reference
    self.reference ||= "PAY-#{SecureRandom.hex(8).upcase}"
  end
end

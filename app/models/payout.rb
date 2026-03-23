# frozen_string_literal: true

class Payout < ApplicationRecord
  belongs_to :reseller

  GATEWAYS = %w[paystack plisio payvra hundredpay].freeze
  STATUSES = %w[pending processing completed failed].freeze

  validates :amount, numericality: { greater_than: 0 }
  validates :gateway, inclusion: { in: GATEWAYS }
  validates :status, inclusion: { in: STATUSES }

  before_create :generate_reference

  scope :pending, -> { where(status: 'pending') }
  scope :completed, -> { where(status: 'completed') }

  def mark_completed!(response = {})
    update!(status: 'completed', gateway_response: response, completed_at: Time.current)
  end

  def mark_failed!(response = {})
    update!(status: 'failed', gateway_response: response)
  end

  private

  def generate_reference
    self.reference ||= "PAY-#{SecureRandom.hex(8).upcase}"
  end
end

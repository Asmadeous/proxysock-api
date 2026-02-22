# frozen_string_literal: true

class CheckoutSession < ApplicationRecord
  belongs_to :user
  has_many :orders, dependent: :nullify

  include AASM

  PAYMENT_METHODS = %w[wallet paystack plisio payvra].freeze

  validates :total_amount, presence: true, numericality: { greater_than: 0 }
  validates :payment_method, presence: true, inclusion: { in: PAYMENT_METHODS }
  validates :gateway_reference, uniqueness: true, allow_nil: true

  aasm column: :status do
    state :pending, initial: true
    state :paid
    state :processing
    state :completed
    state :failed
    state :refunded

    event :mark_paid do
      transitions from: :pending, to: :paid
    end

    event :process do
      transitions from: :paid, to: :processing
    end

    event :complete do
      transitions from: :processing, to: :completed
    end

    event :fail do
      transitions from: %i[pending paid processing], to: :failed
    end

    event :refund do
      transitions from: %i[paid completed], to: :refunded
    end
  end

  # Generate a unique reference for payment gateways
  def generate_reference!
    ref = "CHECKOUT_#{id}_#{SecureRandom.hex(4).upcase}"
    update!(gateway_reference: ref)
    ref
  end

  # Process all linked orders after successful payment
  def provision_orders!
    return false unless paid? || processing?

    process! if paid?

    orders.where(status: 'awaiting_payment').find_each do |order|
      actor = order.user || order.reseller
      OrderProvisioningService.new(order, actor).process_without_deduction!
    end

    complete!
    true
  rescue StandardError => e
    Rails.logger.error("[CheckoutSession] Provisioning failed for session #{id}: #{e.message}")
    fail!
    false
  end
end

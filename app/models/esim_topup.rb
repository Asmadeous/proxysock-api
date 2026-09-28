# frozen_string_literal: true

# One paid top-up on a MeiSIM phone-number line. The customer's balance is charged when
# it is created; staff apply the credit in the MeiSIM portal and mark it completed, or
# cancel it, which refunds the charge.
class EsimTopup < ApplicationRecord
  include AASM

  belongs_to :order
  belongs_to :orderable, polymorphic: true
  belongs_to :esim_topup_subscription, optional: true
  belongs_to :charge_transaction, class_name: 'Transaction', optional: true

  validates :topup_value, :price, numericality: { greater_than: 0 }

  before_validation { self.reference ||= "TOP-#{SecureRandom.hex(6).upcase}" }

  scope :recent_first, -> { order(created_at: :desc) }

  aasm column: :status do
    state :pending, initial: true
    state :completed
    state :cancelled

    event :complete do
      transitions from: :pending, to: :completed, after: -> { update!(completed_at: Time.current) }
    end

    event :cancel do
      transitions from: :pending, to: :cancelled, after: -> { update!(cancelled_at: Time.current) }
    end
  end
end

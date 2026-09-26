# frozen_string_literal: true

# A monthly auto top-up on a MeiSIM phone-number line. EsimTopupRenewalJob charges it
# each month; if the balance is short it becomes past_due and is retried daily.
class EsimTopupSubscription < ApplicationRecord
  include AASM

  belongs_to :order
  belongs_to :orderable, polymorphic: true
  has_many :esim_topups, dependent: :nullify

  validates :topup_value, :price, numericality: { greater_than: 0 }

  scope :live, -> { where.not(status: 'cancelled') }
  scope :due, ->(now = Time.current) { live.where(next_charge_at: ..now) }

  aasm column: :status do
    state :active, initial: true
    state :past_due
    state :cancelled

    event :charged do
      transitions from: %i[active past_due], to: :active
    end

    event :payment_failed do
      transitions from: %i[active past_due], to: :past_due
    end

    event :cancel do
      transitions from: %i[active past_due], to: :cancelled, after: -> { update!(cancelled_at: Time.current) }
    end
  end
end

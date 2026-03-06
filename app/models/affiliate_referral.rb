# frozen_string_literal: true

class AffiliateReferral < ApplicationRecord
  belongs_to :affiliate
  belongs_to :referred,  polymorphic: true
  belongs_to :order,     optional: true

  STATUSES = %w[pending converted rejected].freeze

  validates :status, inclusion: { in: STATUSES }

  scope :pending,   -> { where(status: 'pending') }
  scope :converted, -> { where(status: 'converted') }

  def convert!(order)
    return if converted?

    commission = order.total_amount * (affiliate.commission_rate / 100.0)
    discount   = order.total_amount * (affiliate.discount_rate / 100.0)

    update!(
      order: order,
      status: 'converted',
      converted_at: Time.current,
      commission_amount: commission,
      referee_discount_applied: discount
    )

    # Credit the affiliate's earned balance
    affiliate.increment!(:total_earned, commission)
  end

  def converted?
    status == 'converted'
  end
end

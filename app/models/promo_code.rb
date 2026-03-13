# frozen_string_literal: true

class PromoCode < ApplicationRecord
  DISCOUNT_TYPES = %w[percentage fixed].freeze

  validates :code, presence: true, uniqueness: { case_sensitive: false }
  validates :discount_type, inclusion: { in: DISCOUNT_TYPES }
  validates :discount_value, numericality: { greater_than: 0 }
  validates :max_uses, numericality: { greater_than: 0 }, allow_nil: true

  before_validation :upcase_code

  scope :active, -> { where(active: true) }
  scope :not_expired, -> { where('expires_at IS NULL OR expires_at > ?', Time.current) }
  scope :available, -> { active.not_expired.where('max_uses IS NULL OR current_uses < max_uses') }

  def usable?
    active? && !expired? && !maxed_out?
  end

  def expired?
    expires_at.present? && expires_at < Time.current
  end

  def maxed_out?
    max_uses.present? && current_uses >= max_uses
  end

  # Calculate the discount for a given order amount
  def calculate_discount(order_amount)
    return 0 unless usable?
    return 0 if min_order_amount.present? && order_amount < min_order_amount

    discount = if discount_type == 'percentage'
                 order_amount * (discount_value / 100.0)
               else
                 discount_value
               end

    # Cap discount at max_discount_amount if set
    discount = [discount, max_discount_amount].min if max_discount_amount.present? && max_discount_amount > 0

    # Never discount more than the order total
    [discount, order_amount].min.round(2)
  end

  # Record a use of this promo code
  def record_use!
    increment!(:current_uses)
  end

  private

  def upcase_code
    self.code = code&.upcase&.strip
  end
end

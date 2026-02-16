# frozen_string_literal: true

class Order < ApplicationRecord
  belongs_to :orderable, polymorphic: true, optional: true # ResellOrder or EcommerceOrder (optional for direct orders)
  # belongs_to :user, optional: true # Direct user orders - Replaced by orderable logic if applicable?
  # Wait, let me check if user_id exists in Schema.
  # Schema has NO user_id on orders table. So this is also broken.
  
  def user
    orderable if orderable_type == 'User'
  end
  belongs_to :product
  belongs_to :product_pricing
  belongs_to :checkout_session, optional: true
  # belongs_to :reseller, optional: true # Reseller orders - Replaced by orderable
  
  def reseller
    orderable if orderable_type == 'Reseller'
  end

  # Associations for provisioned resources
  has_one :vm_order, dependent: :destroy
  has_one :vm, through: :vm_order
  has_one :mobile_proxy_order, dependent: :destroy
  has_one :mobile_proxy, through: :mobile_proxy_order # Assuming MobileProxyOrder has_one MobileProxy
  has_one :esim_order, dependent: :destroy
  has_one :vpn_account, dependent: :destroy

  def provisioned_resource
    case product.product_type
    when 'vm' then vm
    when 'proxy' then proxy # delegates to correct proxy association
    when 'esim' then esim_order
    when 'vpn' then vpn_account
    end
  end

  def proxy
    # Helper to find linked proxy across multiple tables/associations
    MobileProxy.find_by(order_id: id) ||
      StaticDatacenterProxy.find_by(order_id: id) ||
      StaticIspProxy.find_by(order_id: id) ||
      ResidentialRotatingProxy.find_by(order_id: id)
  end

  before_save :calculate_total_amount

  include AASM

  # Calculate total amount including reseller surcharge if applicable
  def calculate_total_amount
    return unless product_pricing

    base_price = product_pricing.selling_price

    if reseller
      # Apply reseller surcharge
      total = base_price * reseller.price_multiplier
      self.total_amount = total.round(2)
    else
      self.total_amount = base_price
    end
  end

  aasm column: :status do
    state :pending, initial: true
    state :awaiting_payment # For gateway checkout
    state :processing
    state :active
    state :expired
    state :cancelled
    state :failed

    event :await_payment do
      transitions from: :pending, to: :awaiting_payment
    end

    event :process do
      transitions from: %i[pending awaiting_payment], to: :processing
    end

    event :activate do
      transitions from: :processing, to: :active
    end

    event :expire do
      transitions from: :active, to: :expired
    end

    event :cancel do
      transitions from: %i[pending processing active], to: :cancelled
    end

    event :fail do
      transitions from: %i[pending processing], to: :failed
    end
  end
end

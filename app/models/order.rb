class Order < ApplicationRecord
  belongs_to :orderable, polymorphic: true, optional: true # ResellOrder or EcommerceOrder (optional for direct orders)
  belongs_to :user, optional: true # Direct user orders
  belongs_to :product
  belongs_to :product_pricing
  belongs_to :reseller, optional: true # Reseller orders
  
  # Associations for provisioned resources
  has_one :vm, dependent: :destroy
  has_one :mobile_proxy, dependent: :destroy
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
    state :processing
    state :active
    state :expired
    state :cancelled
    state :failed

    event :process do
      transitions from: :pending, to: :processing
    end

    event :activate do
      transitions from: :processing, to: :active
    end

    event :expire do
      transitions from: :active, to: :expired
    end

    event :cancel do
      transitions from: [:pending, :processing, :active], to: :cancelled
    end

    event :fail do
      transitions from: [:pending, :processing], to: :failed
    end
  end
end

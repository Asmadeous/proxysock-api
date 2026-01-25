class Order < ApplicationRecord
  belongs_to :orderable, polymorphic: true # ResellOrder or EcommerceOrder
  belongs_to :product
  belongs_to :product_pricing
  
  include AASM

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

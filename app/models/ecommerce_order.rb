class EcommerceOrder < ApplicationRecord
  # Table name is 'ecommerce_orders'
  
  belongs_to :order # The master order
  belongs_to :user
  belongs_to :orderable, polymorphic: true # VmOrder, ProxyOrder, etc
  
  # Delegations for convenience
  delegate :status, :total_amount, :currency, :order_number, to: :order
end

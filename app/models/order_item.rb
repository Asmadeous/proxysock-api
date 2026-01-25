class OrderItem < ApplicationRecord
  belongs_to :ecommerce_order
  belongs_to :product
  belongs_to :product_pricing
end

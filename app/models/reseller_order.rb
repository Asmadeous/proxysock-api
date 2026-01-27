# frozen_string_literal: true

class ResellerOrder < ApplicationRecord
  belongs_to :reseller
  belongs_to :product
  belongs_to :product_pricing
  belongs_to :orderable, polymorphic: true
end

# frozen_string_literal: true

class Conversion < ApplicationRecord
  belongs_to :user_session
  belongs_to :user
  belongs_to :product
  belongs_to :cart
  belongs_to :ecommerce_order
end

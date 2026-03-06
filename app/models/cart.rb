# frozen_string_literal: true

class Cart < ApplicationRecord
  belongs_to :orderable, polymorphic: true, optional: true

  has_many :cart_items, dependent: :destroy
  has_many :products, through: :cart_items
end

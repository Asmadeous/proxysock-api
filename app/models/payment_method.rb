# frozen_string_literal: true

class PaymentMethod < ApplicationRecord
  belongs_to :owner, polymorphic: true
end

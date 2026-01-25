class PaymentMethod < ApplicationRecord
  belongs_to :owner, polymorphic: true
end

# frozen_string_literal: true

class ResellerOrder < ApplicationRecord
  belongs_to :reseller
  belongs_to :order
  belongs_to :orderable, polymorphic: true
end

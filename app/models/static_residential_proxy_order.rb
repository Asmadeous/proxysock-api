# frozen_string_literal: true

class StaticResidentialProxyOrder < ApplicationRecord
  belongs_to :order
  has_one :static_residential_proxy, dependent: :nullify
end

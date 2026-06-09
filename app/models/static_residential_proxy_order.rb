# frozen_string_literal: true

class StaticResidentialProxyOrder < ApplicationRecord
  belongs_to :order
  has_many :static_residential_proxies, dependent: :destroy
end

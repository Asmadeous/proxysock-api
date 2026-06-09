# frozen_string_literal: true

class ResidentialRotatingProxyOrder < ApplicationRecord
  belongs_to :order
  has_many :residential_rotating_proxies, dependent: :destroy
end

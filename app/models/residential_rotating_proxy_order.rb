# frozen_string_literal: true

class ResidentialRotatingProxyOrder < ApplicationRecord
  belongs_to :order
  has_one :residential_rotating_proxy, dependent: :nullify
end

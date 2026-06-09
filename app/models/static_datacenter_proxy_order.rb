# frozen_string_literal: true

class StaticDatacenterProxyOrder < ApplicationRecord
  belongs_to :order
  has_many :static_datacenter_proxies, dependent: :destroy
end

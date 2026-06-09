# frozen_string_literal: true

class StaticDatacenterProxyOrder < ApplicationRecord
  belongs_to :order
  has_one :static_datacenter_proxy, dependent: :destroy
end

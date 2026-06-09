# frozen_string_literal: true

class MobileProxyOrder < ApplicationRecord
  belongs_to :order
  has_one :mobile_proxy, dependent: :destroy
end

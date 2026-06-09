# frozen_string_literal: true

class MobileProxyOrder < ApplicationRecord
  belongs_to :order
  has_many :mobile_proxies, dependent: :destroy
end

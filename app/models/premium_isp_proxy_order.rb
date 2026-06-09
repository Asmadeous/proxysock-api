# frozen_string_literal: true

class PremiumIspProxyOrder < ApplicationRecord
  belongs_to :order
  has_many :premium_isp_proxies, dependent: :destroy
end

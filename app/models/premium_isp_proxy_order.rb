# frozen_string_literal: true

class PremiumIspProxyOrder < ApplicationRecord
  belongs_to :order
  has_one :premium_isp_proxy, dependent: :destroy
end

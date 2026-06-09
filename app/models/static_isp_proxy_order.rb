# frozen_string_literal: true

class StaticIspProxyOrder < ApplicationRecord
  belongs_to :order
  has_many :static_isp_proxies, dependent: :destroy
end

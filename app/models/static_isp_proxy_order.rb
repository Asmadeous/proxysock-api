# frozen_string_literal: true

class StaticIspProxyOrder < ApplicationRecord
  belongs_to :order
  has_one :static_isp_proxy, dependent: :destroy
end

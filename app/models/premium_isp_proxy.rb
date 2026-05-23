# frozen_string_literal: true

class PremiumIspProxy < ApplicationRecord
  belongs_to :premium_isp_proxy_order, optional: true
  belongs_to :order, optional: true

  scope :available, -> { where(status: 'available') }
  scope :assigned,  -> { where(status: 'assigned') }
end

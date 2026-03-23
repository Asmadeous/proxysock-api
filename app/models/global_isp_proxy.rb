# frozen_string_literal: true

class GlobalIspProxy < ApplicationRecord
  belongs_to :order, optional: true
  has_one :global_isp_proxy_order, dependent: :destroy
end

# frozen_string_literal: true

class GlobalIspProxyOrder < ApplicationRecord
  belongs_to :order
  belongs_to :global_isp_proxy, optional: true
end

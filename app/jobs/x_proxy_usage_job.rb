# frozen_string_literal: true

class XProxyUsageJob < ApplicationJob
  queue_as :default

  def perform
    service = XProxyService.new

    # 1. Sync proxies to get health and status
    service.sync_proxies

    # 2. Cleanup expired assignments (Time or Data)
    service.cleanup_expired
  end
end

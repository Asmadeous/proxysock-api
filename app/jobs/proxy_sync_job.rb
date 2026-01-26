class ProxySyncJob < ApplicationJob
  queue_as :default

  def perform
    ProxySyncService.new.sync_all
  rescue => e
    Rails.logger.error("[ProxySyncJob] Failed: #{e.message}")
    # Optional: Retry logic or alert
  end
end

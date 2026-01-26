class EsimSyncJob < ApplicationJob
  queue_as :default

  def perform
    EsimSyncService.new.sync_usage!
  end
end

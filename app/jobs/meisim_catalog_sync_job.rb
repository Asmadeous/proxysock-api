# frozen_string_literal: true

class MeisimCatalogSyncJob < ApplicationJob
  queue_as :low

  def perform
    MeisimCatalogSyncService.new.sync!
  end
end

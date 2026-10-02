# frozen_string_literal: true

class MeisimCatalogSyncJob < ApplicationJob
  queue_as :low

  # Hourly, so plan and price changes at MeiSIM reach the storefront and the
  # Reseller API within the hour; the product caches are rebuilt either way.
  def perform
    MeisimCatalogSyncService.new.sync!
  ensure
    Product.bust_catalog_cache!
  end
end

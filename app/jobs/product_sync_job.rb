# frozen_string_literal: true

class ProductSyncJob < ApplicationJob
  queue_as :low

  def perform
    ProductSyncService.new.sync_all_products
  end
end

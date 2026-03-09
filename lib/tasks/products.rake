# frozen_string_literal: true

namespace :products do
  desc 'Sync in-house products (VPS, RDP, USA eSIMs) from db/data/inhouse_products.json'
  task sync_inhouse: :environment do
    puts 'Starting in-house product sync...'
    InHouseProductSyncService.new.sync
    puts 'Sync completed successfully.'
  end
end

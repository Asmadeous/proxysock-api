# frozen_string_literal: true

class SyncInHouseProducts < ActiveRecord::Migration[8.1]
  def up
    InHouseProductSyncService.new.sync
  end

  def down
    # Optional: could deactivate products, but usually not desired for a data migration
  end
end

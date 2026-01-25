class CreateProviderInventorySyncs < ActiveRecord::Migration[8.1]
  def change
    create_table :provider_inventory_syncs do |t|
      t.string :provider
      t.string :sync_type
      t.datetime :last_synced_at
      t.string :sync_status
      t.integer :records_synced
      t.string :error_message
      t.jsonb :data_snapshot

      t.timestamps
    end
  end
end

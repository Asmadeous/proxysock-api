# frozen_string_literal: true

# USA eSIMs and inventory-backed eSIMs (Lyca, Colt, Lebara) are replaced by
# MeiSIM. Their products are switched off rather than deleted because past
# orders still reference them; the stock and credential tables are dropped.
class RemoveUsaEsimAndEsimInventory < ActiveRecord::Migration[8.1]
  INVENTORY_PROVIDERS = %w[lyca colt lebara].freeze

  def up
    now = connection.quote(Time.current)
    providers = INVENTORY_PROVIDERS.map { |p| connection.quote(p) }.join(', ')

    execute <<~SQL.squish
      UPDATE products SET active = false, updated_at = #{now}
      WHERE product_type = 'usa_esim' OR (product_type = 'esim' AND provider IN (#{providers}))
    SQL
    execute "UPDATE product_categories SET active = false, updated_at = #{now} WHERE slug = 'usa_esim'"

    drop_table :usa_esim_credentials
    drop_table :usa_esim_orders
    drop_table :esim_inventories
  end

  def down
    raise ActiveRecord::IrreversibleMigration, 'USA eSIM credentials and eSIM inventory were dropped; restore from backup'
  end
end

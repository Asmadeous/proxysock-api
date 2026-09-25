# frozen_string_literal: true

# USA eSIMs and inventory-backed eSIMs (Lyca, Colt, Lebara) are replaced by
# MeiSIM. Their products are switched off rather than deleted because past
# orders still reference them. The usa_esim_credentials, usa_esim_orders and
# esim_inventories tables are kept: they hold past customers' line details and
# stock records, and nothing reads them any more.
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
  end

  # Products stay switched off; staff can re-enable any of them in the admin panel.
  def down; end
end

# frozen_string_literal: true

# Seed VM/VPS/RDP products and their pricing
# Run: rails runner db/seeds/vm_products.rb
#
# NOTE: Legacy generic plans (vps-starter, vps-basic, etc.) have been
# replaced by the inhouse residential plans in db/data/inhouse_products.json,
# which are synced via InHouseProductSyncService.
# This file now DEACTIVATES the old plans to prevent duplicate listings.

puts '── VM Products: Deactivating legacy generic plans ──'

LEGACY_VPS_SLUGS = %w[
  vps-starter
  vps-basic
  vps-standard
  vps-pro
  vps-enterprise
].freeze

LEGACY_RDP_SLUGS = %w[
  rdp-basic
  rdp-standard
  rdp-pro
  linux-rdp-basic
].freeze

legacy_slugs = LEGACY_VPS_SLUGS + LEGACY_RDP_SLUGS

deactivated = 0
legacy_slugs.each do |slug|
  product = Product.find_by(slug: slug)
  next unless product

  next unless product.update(active: false)

  product.product_pricings.update_all(active: false)
  puts "  ✗ Deactivated: #{product.name} (#{slug})"
  deactivated += 1
end

puts "── Done: #{deactivated} legacy plan(s) deactivated ──"
puts
puts '── Syncing canonical inhouse VPS/RDP plans ──'

# Ensure categories exist (InHouseProductSyncService creates them but guard here too)
ProductCategory.find_or_create_by!(slug: 'vps') do |c|
  c.name = 'VPS'
  c.category_type = 'vm'
  c.active = true
  c.available_to = 'both'
end

ProductCategory.find_or_create_by!(slug: 'rdp') do |c|
  c.name = 'RDP'
  c.category_type = 'vm'
  c.active = true
  c.available_to = 'both'
end

InHouseProductSyncService.new.sync

active_vps = Product.where(product_type: 'vps', active: true).count
active_rdp = Product.where(product_type: 'rdp', active: true).count
puts "── Done: #{active_vps} VPS + #{active_rdp} RDP plans active ──"

# frozen_string_literal: true

# Upsert all API product categories (keyed by slug).
# cat_id is the provider's category ID — stored in metadata.
# Run with: rails runner script/sync_categories.rb

API_CATEGORIES = [
  { cat_id: 2,  name: 'Datacenter',                   slug: 'datacenter',          available_to: 'both',
    category_type: 'proxy' },
  { cat_id: 6,  name: 'ISP',                          slug: 'isp',                 available_to: 'both',
    category_type: 'proxy' },
  { cat_id: 8,  name: 'Premium ISP',                  slug: 'premium-isp',         available_to: 'both',
    category_type: 'proxy' },
  { cat_id: 10, name: 'Static Residential', slug: 'static-residential', available_to: 'both',
    category_type: 'proxy' },
  { cat_id: 11, name: 'Residential Rotating Proxies', slug: 'residential-rotating', available_to: 'both',
    category_type: 'proxy' },
  { cat_id: 12, name: 'Mobile',                       slug: 'mobile',              available_to: 'both',
    category_type: 'proxy' },
  { cat_id: 14, name: 'Residential VPN',              slug: 'residential-vpn',     available_to: 'both',
    category_type: 'vpn' },

  # Non-proxy categories (no provider cat_id)
  { cat_id: nil, name: 'Residential',                  slug: 'residential',         available_to: 'both',
    category_type: 'vps_rdp' },
  { cat_id: nil, name: 'eSIM',                         slug: 'esim',                available_to: 'both',
    category_type: 'esim' }
].freeze

created = 0
updated = 0

API_CATEGORIES.each do |cat|
  record = ProductCategory.find_or_initialize_by(slug: cat[:slug])
  is_new = record.new_record?

  record.assign_attributes(
    name: cat[:name],
    available_to: cat[:available_to],
    category_type: cat[:category_type],
    active: true,
    metadata: (record.metadata || {}).merge(cat[:cat_id] ? { 'cat_id' => cat[:cat_id] } : {})
  )

  record.save!
  is_new ? (created += 1) : (updated += 1)
  puts "  #{is_new ? '➕' : '✏️ '} #{cat[:slug]} (cat_id: #{cat[:cat_id] || 'n/a'})"
end

puts "\n✅ Categories synced — created: #{created}, updated: #{updated}, total: #{ProductCategory.count}"

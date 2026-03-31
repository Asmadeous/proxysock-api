# frozen_string_literal: true

# Seed VM/VPS/RDP products and their pricing
# Run: rails runner db/seeds/vm_products.rb

puts '── Seeding VM Products ──'

# Ensure the VM product category exists
vm_category = ProductCategory.find_or_create_by!(slug: 'vps') do |c|
  c.name = 'Virtual Private Servers'
  c.description = 'VPS and RDP servers with full root access'
  c.category_type = 'vm'
  c.active = true
  c.available_to = 'both'
end

rdp_category = ProductCategory.find_or_create_by!(slug: 'rdp') do |c|
  c.name = 'RDP Servers'
  c.description = 'Remote Desktop servers with GUI access'
  c.category_type = 'vm'
  c.active = true
  c.available_to = 'both'
end

# ── VPS Plans ──────────────────────────────────────────────────────
vps_plans = [
  {
    name: 'Residential VPS Starter',
    slug: 'vps-starter',
    description: '1 vCPU, 1 GB RAM, 20 GB SSD — ideal for lightweight apps',
    product_type: 'vps',
    category: vm_category,
    metadata: { cpu_cores: 1, ram_gb: 1, storage_gb: 20, os_template: 'ubuntu-22-04', vm_type: 'vps' },
    cost: 4.99, price: 6.99
  },
  {
    name: 'ResidentialVPS Basic',
    slug: 'vps-basic',
    description: '2 vCPU, 2 GB RAM, 40 GB SSD — good for small projects',
    product_type: 'vps',
    category: vm_category,
    metadata: { cpu_cores: 2, ram_gb: 2, storage_gb: 40, os_template: 'ubuntu-22-04', vm_type: 'vps' },
    cost: 8.99, price: 12.99
  },
  {
    name: 'Residential VPS Standard',
    slug: 'vps-standard',
    description: '2 vCPU, 4 GB RAM, 60 GB SSD — great all-rounder',
    product_type: 'vps',
    category: vm_category,
    metadata: { cpu_cores: 2, ram_gb: 4, storage_gb: 60, os_template: 'ubuntu-22-04', vm_type: 'vps' },
    cost: 14.99, price: 19.99
  },
  {
    name: 'Residential VPS Pro',
    slug: 'vps-pro',
    description: '4 vCPU, 8 GB RAM, 100 GB SSD — for production workloads',
    product_type: 'vps',
    category: vm_category,
    metadata: { cpu_cores: 4, ram_gb: 8, storage_gb: 100, os_template: 'ubuntu-22-04', vm_type: 'vps' },
    cost: 24.99, price: 34.99
  },
  {
    name: 'Residential VPS Enterprise',
    slug: 'vps-enterprise',
    description: '8 vCPU, 16 GB RAM, 200 GB SSD — high-performance',
    product_type: 'vps',
    category: vm_category,
    metadata: { cpu_cores: 8, ram_gb: 16, storage_gb: 200, os_template: 'ubuntu-22-04', vm_type: 'vps' },
    cost: 49.99, price: 69.99
  }
]

# ── RDP Plans ──────────────────────────────────────────────────────
rdp_plans = [
  {
    name: 'Residential RDP Basic',
    slug: 'rdp-basic',
    description: '2 vCPU, 4 GB RAM, 60 GB SSD — Windows RDP access',
    product_type: 'rdp',
    category: rdp_category,
    metadata: { cpu_cores: 2, ram_gb: 4, storage_gb: 60, os_template: 'windows-server-2022', vm_type: 'rdp', rdp: true },
    cost: 19.99, price: 29.99
  },
  {
    name: 'Residential RDP Standard',
    slug: 'rdp-standard',
    description: '4 vCPU, 8 GB RAM, 100 GB SSD — Windows RDP access',
    product_type: 'rdp',
    category: rdp_category,
    metadata: { cpu_cores: 4, ram_gb: 8, storage_gb: 100, os_template: 'windows-server-2022', vm_type: 'rdp', rdp: true },
    cost: 34.99, price: 49.99
  },
  {
    name: 'Residential RDP Pro',
    slug: 'rdp-pro',
    description: '8 vCPU, 16 GB RAM, 200 GB SSD — Windows RDP access',
    product_type: 'rdp',
    category: rdp_category,
    metadata: { cpu_cores: 8, ram_gb: 16, storage_gb: 200, os_template: 'windows-server-2022', vm_type: 'rdp', rdp: true },
    cost: 59.99, price: 84.99
  },
  {
    name: 'Residential Linux RDP Basic',
    slug: 'linux-rdp-basic',
    description: '2 vCPU, 4 GB RAM, 60 GB SSD — Ubuntu Desktop with RDP',
    product_type: 'rdp',
    category: rdp_category,
    metadata: { cpu_cores: 2, ram_gb: 4, storage_gb: 60, os_template: 'ubuntu-22-04', vm_type: 'rdp', rdp: true },
    cost: 14.99, price: 22.99
  }
]

(vps_plans + rdp_plans).each do |plan|
  product = Product.find_or_initialize_by(slug: plan[:slug])
  product.assign_attributes(
    name: plan[:name],
    description: plan[:description],
    product_type: plan[:product_type],
    product_category: plan[:category],
    metadata: plan[:metadata],
    active: true,
    available_to: 'both'
  )
  product.save!

  # Create monthly pricing
  ProductPricing.find_or_initialize_by(product: product, duration_type: 'monthly').tap do |pp|
    pp.assign_attributes(
      cost_price: plan[:cost],
      selling_price: plan[:price],
      currency: 'USD',
      duration_value: 30,
      active: true
    )
    pp.save!
  end

  puts "  ✓ #{plan[:name]} — $#{plan[:price]}/mo"
end

puts "── Done: #{Product.where(product_type: %w[vps rdp]).count} VM products seeded ──"

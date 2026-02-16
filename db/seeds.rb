# frozen_string_literal: true

# Seed file for proxy products and categories
# Run with: rails db:seed

puts "🌱 Seeding Product Categories..."

categories = [
  { name: 'Datacenter', slug: 'datacenter', available_to: 'both' },
  { name: 'Residential', slug: 'residential', available_to: 'both' },
  { name: 'ISP', slug: 'isp', available_to: 'both' },
  { name: 'Mobile', slug: 'mobile', available_to: 'both' },
  { name: 'VPN', slug: 'vpn', available_to: 'both' },
  { name: 'eSIM', slug: 'esim', available_to: 'both' }
]

categories.each do |cat|
  ProductCategory.find_or_create_by!(slug: cat[:slug]) do |c|
    c.name = cat[:name]
    c.available_to = cat[:available_to]
  end
end

puts "✅ Created #{ProductCategory.count} categories"

datacenter_cat = ProductCategory.find_by!(slug: 'datacenter')
residential_cat = ProductCategory.find_by!(slug: 'residential')
isp_cat = ProductCategory.find_by!(slug: 'isp')
mobile_cat = ProductCategory.find_by!(slug: 'mobile')

puts "🌱 Seeding Proxy Products..."

proxy_products = [
  # Datacenter Proxies
  {
    name: 'Datacenter Proxy - 10 IPs',
    description: 'High-speed datacenter proxies with 10 dedicated IPs',
    product_type: 'proxy',
    provider: 'myproxyapi',
    available_to: 'both',
    product_category: datacenter_cat,
    metadata: { ips_included: 10, bandwidth: 'unlimited' },
    price: 20.00
  },
  {
    name: 'Datacenter Proxy - 50 IPs',
    description: 'High-speed datacenter proxies with 50 dedicated IPs',
    product_type: 'proxy',
    provider: 'myproxyapi',
    available_to: 'both',
    product_category: datacenter_cat,
    metadata: { ips_included: 50, bandwidth: 'unlimited' },
    price: 80.00
  },
  {
    name: 'Datacenter Proxy - 100 IPs',
    description: 'High-speed datacenter proxies with 100 dedicated IPs',
    product_type: 'proxy',
    provider: 'myproxyapi',
    available_to: 'both',
    product_category: datacenter_cat,
    metadata: { ips_included: 100, bandwidth: 'unlimited' },
    price: 150.00
  },
  # Residential Proxies
  {
    name: 'Residential Proxy - Pay Per GB',
    description: 'Rotating residential proxies billed per GB usage',
    product_type: 'proxy',
    provider: 'myproxyapi',
    available_to: 'both',
    product_category: residential_cat,
    metadata: { gb_min: 1, gb_max: 100, billing_type: 'usage_gb' },
    price: 3.50
  },
  {
    name: 'Residential Proxy - 10GB Package',
    description: '10GB rotating residential proxy package',
    product_type: 'proxy',
    provider: 'myproxyapi',
    available_to: 'both',
    product_category: residential_cat,
    metadata: { gb_min: 10, gb_max: 10, billing_type: 'usage_gb' },
    price: 30.00
  },
  {
    name: 'Residential Proxy - 50GB Package',
    description: '50GB rotating residential proxy package',
    product_type: 'proxy',
    provider: 'myproxyapi',
    available_to: 'both',
    product_category: residential_cat,
    metadata: { gb_min: 50, gb_max: 50, billing_type: 'usage_gb' },
    price: 125.00
  },
  # ISP Proxies
  {
    name: 'ISP Proxy - 5 IPs',
    description: 'Premium ISP proxies with datacenter speed and residential IP reputation',
    product_type: 'proxy',
    provider: 'myproxyapi',
    available_to: 'both',
    product_category: isp_cat,
    metadata: { ips_included: 5 },
    price: 25.00
  },
  {
    name: 'ISP Proxy - 25 IPs',
    description: 'Premium ISP proxies with datacenter speed and residential IP reputation',
    product_type: 'proxy',
    provider: 'myproxyapi',
    available_to: 'both',
    product_category: isp_cat,
    metadata: { ips_included: 25 },
    price: 100.00
  },
  # Mobile Proxies
  {
    name: 'Mobile Proxy - 1 Day',
    description: 'Daily mobile proxy with real 4G/5G carrier IPs',
    product_type: 'proxy',
    provider: 'myproxyapi',
    available_to: 'both',
    product_category: mobile_cat,
    metadata: { duration_days: 1, isp: [{ id: 7, name: 'AT&T', slug: 'att' }, { id: 8, name: 'T-Mobile', slug: 'tmobile' }, { id: 9, name: 'Verizon', slug: 'verizon' }] },
    price: 15.00
  },
  {
    name: 'Mobile Proxy - 7 Days',
    description: 'Weekly mobile proxy with real 4G/5G carrier IPs',
    product_type: 'proxy',
    provider: 'myproxyapi',
    available_to: 'both',
    product_category: mobile_cat,
    metadata: { duration_days: 7, isp: [{ id: 7, name: 'AT&T', slug: 'att' }, { id: 8, name: 'T-Mobile', slug: 'tmobile' }, { id: 9, name: 'Verizon', slug: 'verizon' }] },
    price: 50.00
  },
  {
    name: 'Mobile Proxy - 30 Days',
    description: 'Monthly mobile proxy with real 4G/5G carrier IPs',
    product_type: 'proxy',
    provider: 'myproxyapi',
    available_to: 'both',
    product_category: mobile_cat,
    metadata: { duration_days: 30, isp: [{ id: 7, name: 'AT&T', slug: 'att' }, { id: 8, name: 'T-Mobile', slug: 'tmobile' }, { id: 9, name: 'Verizon', slug: 'verizon' }] },
    price: 150.00
  }
]

proxy_products.each do |prod|
  price = prod.delete(:price)
  product = Product.find_or_create_by!(name: prod[:name]) do |p|
    p.description = prod[:description]
    p.product_type = prod[:product_type]
    p.provider = prod[:provider]
    p.available_to = prod[:available_to]
    p.product_category = prod[:product_category]
    p.metadata = prod[:metadata]
  end

  # Create pricing
  ProductPricing.find_or_create_by!(product: product, currency: 'USD') do |pp|
    pp.selling_price = price
    pp.cost_price = price * 0.6
    pp.active = true
  end
end

puts "✅ Created #{Product.count} products with pricing"
puts "🌱 Seeding complete!"

# frozen_string_literal: true

puts "Starting Proxy and eSIM database seed..."

# Categories
proxy_category = ProductCategory.find_or_create_by!(name: 'Proxies', slug: 'proxies', category_type: 'proxy', active: true)
esim_category = ProductCategory.find_or_create_by!(name: 'eSIMs', slug: 'esims', category_type: 'esim', active: true)

# --- Proxies ---

# Datacenter Proxies
datacenter_proxy = Product.find_or_create_by!(slug: 'datacenter-proxy-shared') do |p|
  p.name = 'Datacenter Proxy - Shared'
  p.description = 'Affordable shared datacenter proxy with high speed'
  p.product_category = proxy_category
  p.product_type = 'proxy'
  p.provider = 'proxysock'
  p.active = true
  p.metadata = {
    ips_included: 1,
    billing_type: 'monthly',
    duration_days: 30,
    gb_min: 0,
    gb_max: 0,
    category_slug: 'datacenter',
    isp: [
      {
        id: 1,
        name: 'Datacenter ISP 1',
        slug: 'dc1',
        locations: {
          'US' => { name: 'United States', cities: [{ id: 101, name: 'Ashburn', state: 'VA' }] }
        }
      }
    ]
  }
end
ProductPricing.find_or_create_by!(product_id: datacenter_proxy.id, active: true) do |pp|
  pp.cost_price = 0.5
  pp.selling_price = 2.5
  pp.currency = 'USD'
  pp.duration_type = 'months'
  pp.duration_value = 1
end

# Residential Proxies
residential_proxy = Product.find_or_create_by!(slug: 'residential-proxy-gb') do |p|
  p.name = 'Residential Proxy - Per GB'
  p.description = 'Premium residential proxy billed per GB'
  p.product_category = proxy_category
  p.product_type = 'proxy'
  p.provider = 'proxysock'
  p.active = true
  p.metadata = {
    ips_included: 1,
    billing_type: 'usage_gb',
    duration_days: 30,
    gb_min: 1,
    gb_max: 100,
    category_slug: 'residential',
    isp: []
  }
end
ProductPricing.find_or_create_by!(product_id: residential_proxy.id, active: true) do |pp|
  pp.cost_price = 1.0
  pp.selling_price = 4.0
  pp.currency = 'USD'
  pp.duration_type = 'gb'
  pp.duration_value = 1
end

# Mobile Proxies
mobile_proxy = Product.find_or_create_by!(slug: 'mobile-proxy-usa') do |p|
  p.name = 'USA Mobile Proxy - 30 Days'
  p.description = 'High-quality 4G/5G mobile proxies in the US'
  p.product_category = proxy_category
  p.product_type = 'proxy'
  p.provider = 'proxysock'
  p.active = true
  p.metadata = {
    ips_included: 1,
    billing_type: 'monthly',
    duration_days: 30,
    gb_min: 0,
    gb_max: 0,
    category_slug: 'mobile',
    isp: [
      { id: 201, name: 'AT&T', slug: 'att' },
      { id: 202, name: 'T-Mobile', slug: 'tmobile' },
      { id: 203, name: 'Verizon', slug: 'verizon' }
    ]
  }
end
ProductPricing.find_or_create_by!(product_id: mobile_proxy.id, active: true) do |pp|
  pp.cost_price = 20.0
  pp.selling_price = 45.0
  pp.currency = 'USD'
  pp.duration_type = 'months'
  pp.duration_value = 1
end

# ISP Proxies
isp_proxy = Product.find_or_create_by!(slug: 'isp-proxy-premium') do |p|
  p.name = 'Premium ISP Proxy'
  p.description = 'Datacenter speeds with residential trust'
  p.product_category = proxy_category
  p.product_type = 'proxy'
  p.provider = 'proxysock'
  p.active = true
  p.metadata = {
    ips_included: 1,
    billing_type: 'monthly',
    duration_days: 30,
    gb_min: 0,
    gb_max: 0,
    category_slug: 'isp',
    isp: [
      {
        id: 301,
        name: 'Comcast Business',
        slug: 'comcast',
        locations: {
          'US' => { name: 'United States', cities: [{ id: 401, name: 'New York', state: 'NY' }] }
        }
      }
    ]
  }
end
ProductPricing.find_or_create_by!(product_id: isp_proxy.id, active: true) do |pp|
  pp.cost_price = 2.0
  pp.selling_price = 5.0
  pp.currency = 'USD'
  pp.duration_type = 'months'
  pp.duration_value = 1
end


# --- eSIMs ---

# USA eSIM - Voice & Data
usa_esim_voice = Product.find_or_create_by!(slug: 'usa-esim-5gb-voice') do |p|
  p.name = 'USA eSIM - 5GB + Voice'
  p.description = '5GB data with unlimited calls & texts in the USA'
  p.product_category = esim_category
  p.product_type = 'usa_esim'
  p.provider = 'proxysock'
  p.provider_type = 'lyca'
  p.active = true
  p.metadata = {
    calling_minutes: nil, # Unlimited
    sms_quota: 10000,
    data_gb: 5,
    duration_days: 30,
    esim_type: 'voice_data_sms',
    features: ['5G Coverage', 'Instant Delivery', 'Unlimited Calls & SMS']
  }
end
ProductPricing.find_or_create_by!(product_id: usa_esim_voice.id, active: true) do |pp|
  pp.cost_price = 5.0
  pp.selling_price = 15.0
  pp.currency = 'USD'
  pp.duration_type = 'months'
  pp.duration_value = 1
end

# USA eSIM - Data Only
usa_esim_data = Product.find_or_create_by!(slug: 'usa-esim-unlimited-data') do |p|
  p.name = 'USA eSIM - Unlimited Data'
  p.description = 'Unlimited 5G data across the US (Data Only)'
  p.product_category = esim_category
  p.product_type = 'usa_esim'
  p.provider = 'proxysock'
  p.provider_type = 'colt'
  p.active = true
  p.metadata = {
    calling_minutes: 0,
    sms_quota: 0,
    data_gb: nil, # Unlimited
    duration_days: 30,
    esim_type: 'data_only',
    features: ['5G Coverage', 'Instant Delivery', 'Data Only']
  }
end
ProductPricing.find_or_create_by!(product_id: usa_esim_data.id, active: true) do |pp|
  pp.cost_price = 10.0
  pp.selling_price = 25.0
  pp.currency = 'USD'
  pp.duration_type = 'months'
  pp.duration_value = 1
end

# Global eSIM - 1GB
global_esim_1 = Product.find_or_create_by!(slug: 'global-esim-1gb') do |p|
  p.name = 'Global Starter'
  p.description = '1GB data valid for 7 days in 200+ countries'
  p.product_category = esim_category
  p.product_type = 'esim'
  p.provider = 'proxysock'
  p.provider_type = 'colt'
  p.active = true
  p.metadata = {
    calling_minutes: 0,
    sms_quota: 0,
    data_gb: 1,
    duration_days: 7,
    esim_type: 'data_only',
    features: ['5G/4G Coverage', 'Instant Delivery', '200+ Countries']
  }
end
ProductPricing.find_or_create_by!(product_id: global_esim_1.id, active: true) do |pp|
  pp.cost_price = 4.0
  pp.selling_price = 9.99
  pp.currency = 'USD'
  pp.duration_type = 'days'
  pp.duration_value = 7
end

# Global eSIM - 3GB
global_esim_3 = Product.find_or_create_by!(slug: 'global-esim-3gb') do |p|
  p.name = 'Global Traveler'
  p.description = '3GB data valid for 15 days in 200+ countries'
  p.product_category = esim_category
  p.product_type = 'esim'
  p.provider = 'proxysock'
  p.provider_type = 'colt'
  p.active = true
  p.metadata = {
    calling_minutes: 0,
    sms_quota: 0,
    data_gb: 3,
    duration_days: 15,
    esim_type: 'data_only',
    features: ['5G/4G Coverage', 'Instant Delivery', '200+ Countries']
  }
end
ProductPricing.find_or_create_by!(product_id: global_esim_3.id, active: true) do |pp|
  pp.cost_price = 10.0
  pp.selling_price = 24.99
  pp.currency = 'USD'
  pp.duration_type = 'days'
  pp.duration_value = 15
end

puts "Database successfully seeded with Proxies and eSIMs!"

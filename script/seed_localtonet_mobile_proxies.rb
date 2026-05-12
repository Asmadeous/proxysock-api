# frozen_string_literal: true

category = ProductCategory.find_or_create_by!(slug: 'mobile') do |c|
  c.name = 'Mobile'
  c.available_to = 'both'
  c.category_type = 'mobile'
end

# Prices can be adjusted later via Admin Panel, these are defaults.
plans = [
  {
    name: 'USA Mobile Proxy - Per GB',
    duration_type: 'months',
    duration_value: 1, # Credentials valid for 1 month, billed per GB
    price: 3.00, # $3 / GB API cost
    metadata: { 'billing_type' => 'usage_gb', 'country_code' => 'US', 'gb_min' => 1, 'gb_max' => 9999 }
  },
  {
    name: 'USA Mobile Proxy - Daily',
    duration_type: 'days',
    duration_value: 1,
    price: 5.00, # $5 API cost
    metadata: { 'billing_type' => 'monthly', 'country_code' => 'US' }
  },
  {
    name: 'USA Mobile Proxy - Weekly',
    duration_type: 'days',
    duration_value: 7,
    price: 25.00, # $25 API cost
    metadata: { 'billing_type' => 'monthly', 'country_code' => 'US' }
  },
  {
    name: 'USA Mobile Proxy - Monthly',
    duration_type: 'months',
    duration_value: 1,
    price: 80.00, # $80 API cost
    metadata: { 'billing_type' => 'monthly', 'country_code' => 'US' }
  }
]

plans.each do |plan_data|
  slug = "localtonet-#{plan_data[:name].parameterize}"
  product = Product.find_or_initialize_by(slug: slug)

  product.assign_attributes(
    name: plan_data[:name],
    product_category: category,
    product_type: 'mobile',
    provider: 'localtonet',
    available_to: 'both',
    active: true,
    metadata: plan_data[:metadata]
  )
  product.save!

  pricing = product.product_pricings.find_or_initialize_by(
    currency: 'USD',
    duration_type: plan_data[:duration_type],
    duration_value: plan_data[:duration_value]
  )

  # Defaults (API cost, cost, reseller, user)
  pricing.assign_attributes(
    api_price: plan_data[:price],
    cost_price: plan_data[:price],
    selling_price: (plan_data[:price] * 1.15).round(2),
    reseller_selling_price: (plan_data[:price] * 1.15).round(2),
    user_selling_price: (plan_data[:price] * 1.30).round(2),
    active: true
  )
  pricing.save!

  puts "Created/Updated: #{product.name} - #{pricing.duration_value} #{pricing.duration_type} @ $#{pricing.api_price}"
end

puts 'Successfully seeded LocalToNet USA Mobile Proxies!'

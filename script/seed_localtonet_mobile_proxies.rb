# frozen_string_literal: true

category = ProductCategory.find_or_create_by!(slug: 'mobile') do |c|
  c.name = 'Mobile'
  c.available_to = 'both'
  c.category_type = 'mobile'
end

# Prices as specified by admin.
# User selling prices: Per GB $5, Daily $15, Weekly $70, Monthly $150
# Markup rule: user = cost * 1.40, reseller = cost * 1.20
plans = [
  {
    name: 'USA Mobile Proxy - Per GB',
    duration_type: 'months',
    duration_value: 1, # Credentials valid for 1 month, billed per GB
    user_price: 5.00,   # $5 / GB user selling price
    metadata: { 'billing_type' => 'usage_gb', 'country_code' => 'US', 'gb_min' => 1, 'gb_max' => 9999 }
  },
  {
    name: 'USA Mobile Proxy - Daily',
    duration_type: 'days',
    duration_value: 1,
    user_price: 15.00,  # $15 user selling price
    metadata: { 'billing_type' => 'monthly', 'country_code' => 'US' }
  },
  {
    name: 'USA Mobile Proxy - Weekly',
    duration_type: 'days',
    duration_value: 7,
    user_price: 70.00,  # $70 user selling price
    metadata: { 'billing_type' => 'monthly', 'country_code' => 'US' }
  },
  {
    name: 'USA Mobile Proxy - Monthly',
    duration_type: 'months',
    duration_value: 1,
    user_price: 150.00, # $150 user selling price
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

  # Markup rule: user_price = cost * 1.40, reseller_price = cost * 1.20
  cost_price        = (plan_data[:user_price] / 1.40).round(2)
  reseller_price    = (cost_price * 1.20).round(2)
  user_price        = plan_data[:user_price]

  # Defaults (API cost, cost, reseller, user)
  pricing.assign_attributes(
    api_price: cost_price,
    cost_price: cost_price,
    selling_price: reseller_price,
    reseller_selling_price: reseller_price,
    user_selling_price: user_price,
    active: true
  )
  pricing.save!

  puts "Created/Updated: #{product.name} - #{pricing.duration_value} #{pricing.duration_type} @ $#{pricing.api_price}"
end

puts 'Successfully seeded LocalToNet USA Mobile Proxies!'

# frozen_string_literal: true

puts 'Seeding eSIM Products (USA eSIMs & Global eSIMs)...'

usa_esim_category = ProductCategory.find_or_create_by!(slug: 'usa_esim') do |c|
  c.name = 'USA eSIM'
  c.description = 'Premium USA eSIMs with Voice, SMS & Data'
  c.active = true
  c.category_type = 'esim'
end

usa_esims_data = [
  {
    'id' => 'colt-usa-1',
    'provider' => 'colt',
    'name' => 'Colt USA Premium',
    'price' => 19.00,
    'currency_code' => 'USD',
    'voice_minutes' => 'Unlimited',
    'sms_included' => true,
    'data_amount' => '2 GB',
    'duration' => 30,
    'duration_unit' => 'days',
    'features' => ['US Phone Number Included', 'Unlimited Voice Calls', 'Unlimited SMS & MMS', '10 GB High-Speed Data',
                   '4G/5G Network Access', 'Instant Activation'],
    'phone_number_included' => true
  },
  {
    'id' => 'lyca-usa-1',
    'provider' => 'lyca',
    'name' => 'Lyca USA Essential',
    'price' => 19.00,
    'currency_code' => 'USD',
    'voice_minutes' => 'Unlimited',
    'sms_included' => true,
    'data_amount' => '8 GB',
    'duration' => 30,
    'duration_unit' => 'days',
    'features' => ['US Phone Number Included', 'Unlimited Voice Calls', 'Unlimited SMS & MMS', '8 GB High-Speed Data',
                   '4G/5G Network Access', 'No Contract Required'],
    'phone_number_included' => true
  }
]

seeded_product_ids = []

usa_esims_data.each do |data|
  gb_match = data['data_amount'].match(/(\d+)\s*GB/i)
  data_gb = gb_match ? gb_match[1].to_f : 1.0

  product = Product.find_or_initialize_by(provider_product_id: data['id'])

  product.name = data['name']
  product.description = data['features'].join(', ')
  product.product_category_id = usa_esim_category.id
  product.product_type = 'usa_esim'
  product.provider = data['provider']
  product.provider_type = 'inventory'
  product.active = true
  product.available_to = data['provider'] == 'colt' ? 'reseller' : 'both'

  product.metadata = {
    esim_type: 'voice_data_sms',
    country_code: 'US',
    data_gb: data_gb,
    duration_days: data['duration'],
    features: data['features'],
    category_slug: 'usa_esim',
    moq: data['provider'] == 'colt' ? 5 : 1
  }

  product.save!
  seeded_product_ids << product.id

  pricing = product.product_pricings.find_or_initialize_by(duration_type: data['duration_unit'])
  pricing.selling_price          = data['price']           # reseller price is the selling price
  pricing.reseller_selling_price = data['price']           # $19 for resellers
  pricing.user_selling_price     = 25.00                   # $25 for end users
  pricing.currency               = data['currency_code']
  pricing.duration_value         = data['duration']
  pricing.active                 = true
  pricing.save!

  puts "==> Seeded USA eSIM: #{product.name} (MOQ: #{product.metadata['moq']})"
end

# frozen_string_literal: true

puts "Seeding eSIM Products (USA eSIMs & Global eSIMs)..."

# ══════════════════════════════════════════════════════════════
# PART 1: USA eSIMs (Colt & Lyca) — inventory-based
# ══════════════════════════════════════════════════════════════

usa_esim_category = ProductCategory.find_or_create_by!(slug: "usa_esim") do |c|
  c.name = "USA eSIM"
  c.description = "Premium USA eSIMs with Voice, SMS & Data"
  c.active = true
  c.category_type = "esim"
end

usa_esims_data = [
  {
    "id" => "colt-usa-1",
    "provider" => "colt",
    "name" => "Colt USA Premium",
    "price" => 24.99,
    "currency_code" => "USD",
    "voice_minutes" => "Unlimited",
    "sms_included" => true,
    "data_amount" => "2 GB",
    "duration" => 30,
    "duration_unit" => "days",
    "features" => ["US Phone Number Included", "Unlimited Voice Calls", "Unlimited SMS & MMS", "10 GB High-Speed Data", "4G/5G Network Access", "Instant Activation"],
    "phone_number_included" => true
  },
  {
    "id" => "lyca-usa-1",
    "provider" => "lyca",
    "name" => "Lyca USA Essential",
    "price" => 24.99,
    "currency_code" => "USD",
    "voice_minutes" => "Unlimited",
    "sms_included" => true,
    "data_amount" => "8 GB",
    "duration" => 30,
    "duration_unit" => "days",
    "features" => ["US Phone Number Included", "Unlimited Voice Calls", "Unlimited SMS & MMS", "8 GB High-Speed Data", "4G/5G Network Access", "No Contract Required"],
    "phone_number_included" => true
  }
]

seeded_product_ids = []

usa_esims_data.each do |data|
  gb_match = data["data_amount"].match(/(\d+)\s*GB/i)
  data_gb = gb_match ? gb_match[1].to_f : 1.0

  product = Product.find_or_initialize_by(provider_product_id: data["id"])

  product.name = data["name"]
  product.description = data["features"].join(", ")
  product.product_category_id = usa_esim_category.id
  product.product_type = "usa_esim"
  product.provider = data["provider"]
  product.provider_type = "inventory"
  product.active = true
  product.available_to = data["provider"] == "colt" ? "reseller" : "both"

  product.metadata = {
    esim_type: "voice_data_sms",
    country_code: "US",
    data_gb: data_gb,
    duration_days: data["duration"],
    features: data["features"],
    category_slug: "usa_esim",
    moq: data["provider"] == "colt" ? 5 : 1
  }

  product.save!
  seeded_product_ids << product.id

  pricing = product.product_pricings.find_or_initialize_by(duration_type: data["duration_unit"])
  pricing.selling_price = data["price"]
  pricing.currency = data["currency_code"]
  pricing.duration_value = data["duration"]
  pricing.active = true
  pricing.save!

  puts "==> Seeded USA eSIM: #{product.name} (MOQ: #{product.metadata['moq']})"
end

# ══════════════════════════════════════════════════════════════
# PART 2: Global eSIMs (API-based via eSIM Access)
# ══════════════════════════════════════════════════════════════

global_esim_category = ProductCategory.find_or_create_by!(slug: "esim") do |c|
  c.name = "Global eSIM"
  c.description = "Global eSIMs with data plans for international coverage"
  c.active = true
  c.category_type = "esim"
end

json_path = File.join(__dir__, "global_esims.json")

unless File.exist?(json_path)
  puts "⚠️  Skipping Global eSIMs: #{json_path} not found."
  puts "   Place your global eSIM JSON data at #{json_path} and re-run."
else
  global_esims = JSON.parse(File.read(json_path))
  puts "Loading #{global_esims.size} global eSIM plans from JSON..."

  global_esims.each do |data|
    next unless data["is_active"]

    product = Product.find_or_initialize_by(provider_product_id: data["package_code"])

    # Price is in micro-units (e.g. 36000 = $3.60), divide by 10000
    selling_price = data["price"].to_f / 10000.0
    api_price     = data["api_price"].to_f / 10000.0
    data_gb       = (data["volume"].to_f / 1073741824.0).round(1) # bytes -> GB

    # Determine esim_type based on sms_status
    sms_status = data["sms_status"].to_i
    esim_type = sms_status > 0 ? "data_sms" : "data_only"

    product.assign_attributes(
      name: data["name"],
      slug: data["slug"],
      description: data["description"],
      product_category_id: global_esim_category.id,
      product_type: "esim",
      provider: "esim_access",
      provider_type: "api",
      available_to: "both",
      active: true,
      metadata: {
        esim_type: esim_type,
        package_code: data["package_code"],
        location_code: data["location_code"],
        location_name: data["location_name"],
        data_gb: data_gb,
        volume_bytes: data["volume"],
        duration: data["duration"],
        duration_unit: data["duration_unit"],
        scope: data["scope"],
        api_price: api_price,
        sms_status: sms_status,
        data_type: data["data_type"].to_i,
        speed: data["speed"],
        network: data["network"],
        location_network_list: data["location_network_list"],
        category_slug: "esim"
      }
    )
    product.save!
    seeded_product_ids << product.id

    # Create or update pricing
    pricing = ProductPricing.find_or_initialize_by(product: product, currency: data["currency_code"])
    pricing.assign_attributes(
      selling_price: selling_price,
      duration_type: data["duration_unit"]&.downcase,
      duration_value: data["duration"],
      active: true
    )
    pricing.save!
  end

  puts "==> Seeded #{global_esims.size} Global eSIM plans."
end

# ══════════════════════════════════════════════════════════════
# PART 3: Cleanup — deactivate any eSIM products NOT in this seed
# ══════════════════════════════════════════════════════════════

if seeded_product_ids.any?
  esim_category_ids = [usa_esim_category.id, global_esim_category.id]
  stale = Product.where(product_category_id: esim_category_ids)
                 .where.not(id: seeded_product_ids)
                 .where(active: true)

  if stale.any?
    puts "Deactivating #{stale.count} stale eSIM product(s): #{stale.pluck(:name).join(', ')}"
    stale.update_all(active: false)
  end
end

puts "eSIM Seeding complete!"

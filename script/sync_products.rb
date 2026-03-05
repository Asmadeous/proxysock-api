# frozen_string_literal: true

# Sync all products from the provided JSON into the DB.
# Wipes/Deactivates products NOT in the list for the specified categories.
# Run with: rails runner script/sync_products.rb

PRODUCTS = [
  # ── Datacenter (id: 2) ──────────────────────────────────────
  { product_type: "proxy", id: "10",  name: "1 x Datacenter Proxy",          price: 3.99 },
  { product_type: "proxy", id: "11",  name: "3 x Datacenter Proxies",        price: 10.99 },
  { product_type: "proxy", id: "12",  name: "5 x Datacenter Proxies",        price: 15.99 },
  { product_type: "proxy", id: "13",  name: "10 x Datacenter Proxies",       price: 25.99 },
  { product_type: "proxy", id: "14",  name: "20 x Datacenter Proxies",       price: 49.99 },
  { product_type: "proxy", id: "15",  name: "50 x Datacenter Proxies",       price: 99.99 },
  { product_type: "proxy", id: "16",  name: "100 x Datacenter Proxies",      price: 189.99 },
  { product_type: "proxy", id: "17",  name: "150 x Datacenter Proxies",      price: 269.99 },
  { product_type: "proxy", id: "18",  name: "200 x Datacenter Proxies",      price: 359.99 },
  { product_type: "proxy", id: "116", name: "500 x Datacenter Proxies",      price: 749.99 },
  { product_type: "proxy", id: "117", name: "1000 x Datacenter Proxies",     price: 1299.99 },

  # ── ISP (id: 6) ─────────────────────────────────────────────
  { product_type: "proxy", id: "57",  name: "1 x ISP Proxy",           price: 5.99 },
  { product_type: "proxy", id: "58",  name: "3 x ISP Proxies",         price: 14.99 },
  { product_type: "proxy", id: "59",  name: "5 x ISP Proxies",         price: 24.99 },
  { product_type: "proxy", id: "60",  name: "10 x ISP Proxies",        price: 39.99 },
  { product_type: "proxy", id: "61",  name: "20 x ISP Proxies",        price: 74.99 },
  { product_type: "proxy", id: "62",  name: "50 x ISP Proxies",        price: 149.99 },
  { product_type: "proxy", id: "63",  name: "100 x ISP Proxies",       price: 279.99 },
  { product_type: "proxy", id: "64",  name: "150 x ISP Proxies",       price: 399.99 },
  { product_type: "proxy", id: "65",  name: "200 x ISP Proxies",       price: 499.99 },
  { product_type: "proxy", id: "118", name: "500 x ISP Proxies",       price: 999.99 },
  { product_type: "proxy", id: "119", name: "1000 x ISP Proxies",      price: 1799.99 },

  # ── Premium ISP (id: 8) ─────────────────────────────────────
  { product_type: "proxy", id: "84",  name: "1 x Premium ISP Proxy",          price: 7.99 },
  { product_type: "proxy", id: "85",  name: "3 x Premium ISP Proxies",         price: 20.99 },
  { product_type: "proxy", id: "86",  name: "5 x Premium ISP Proxies",         price: 29.99 },
  { product_type: "proxy", id: "87",  name: "10 x Premium ISP Proxies",        price: 54.99 },
  { product_type: "proxy", id: "88",  name: "20 x Premium ISP Proxies",        price: 99.99 },
  { product_type: "proxy", id: "89",  name: "50 x Premium ISP Proxies",        price: 224.99 },
  { product_type: "proxy", id: "90",  name: "100 x Premium ISP Proxies",       price: 399.99 },
  { product_type: "proxy", id: "91",  name: "150 x Premium ISP Proxies",       price: 549.99 },
  { product_type: "proxy", id: "92",  name: "200 x Premium ISP Proxies",       price: 699.99 },
  { product_type: "proxy", id: "120", name: "500 x Premium ISP Proxies",       price: 1499.99 },
  { product_type: "proxy", id: "121", name: "1000 x Premium ISP Proxies",      price: 2699.99 },

  # ── Static Residential (id: 10) ─────────────────────────────
  { product_type: "proxy", id: "105", name: "1 x Static Residential Proxy",          price: 9.99 },
  { product_type: "proxy", id: "106", name: "3 x Static Residential Proxies",        price: 26.99 },
  { product_type: "proxy", id: "107", name: "5 x Static Residential Proxies",        price: 39.99 },
  { product_type: "proxy", id: "108", name: "10 x Static Residential Proxies",       price: 69.99 },
  { product_type: "proxy", id: "109", name: "20 x Static Residential Proxies",       price: 119.99 },
  { product_type: "proxy", id: "110", name: "50 x Static Residential Proxies",       price: 249.99 },
  { product_type: "proxy", id: "111", name: "100 x Static Residential Proxies",      price: 449.99 },
  { product_type: "proxy", id: "112", name: "150 x Static Residential Proxies",      price: 599.99 },
  { product_type: "proxy", id: "113", name: "200 x Static Residential Proxies",      price: 799.99 },
  { product_type: "proxy", id: "114", name: "500 x Static Residential Proxies",      price: 1749.99 },
  { product_type: "proxy", id: "115", name: "1000 x Static Residential Proxies",     price: 2999.99 },

  # ── Residential Rotating Proxies (id: 11) ───────────────────
  { product_type: "proxy", id: "122", name: "1 GB Residential Rotating Proxies traffic",          price: 9.99, gb_min: 1, gb_max: 1 },
  { product_type: "proxy", id: "123", name: "2-5 GB Residential Rotating Proxies traffic",        price: 9.99, gb_min: 2, gb_max: 5 },
  { product_type: "proxy", id: "125", name: "6-10 GB Residential Rotating Proxies traffic",       price: 9.99, gb_min: 6, gb_max: 10 },
  { product_type: "proxy", id: "126", name: "11-50 GB Residential Rotating Proxies traffic",      price: 8.99, gb_min: 11, gb_max: 50 },
  { product_type: "proxy", id: "127", name: "51-100 GB Residential Rotating Proxies traffic",     price: 8.99, gb_min: 51, gb_max: 100 },
  { product_type: "proxy", id: "128", name: "101-200 GB Residential Rotating Proxies traffic",    price: 7.99, gb_min: 101, gb_max: 200 },
  { product_type: "proxy", id: "129", name: "201-500 GB Residential Rotating Proxies traffic",    price: 6.99, gb_min: 201, gb_max: 500 },
  { product_type: "proxy", id: "130", name: "501-999 GB Residential Rotating Proxies traffic",    price: 5.99, gb_min: 501, gb_max: 999 },
  { product_type: "proxy", id: "131", name: "1000 GB Residential Rotating Proxies traffic",       price: 4.99, gb_min: 1000, gb_max: 1000 },

  # ── Mobile (id: 12) ─────────────────────────────────────────
  # USA Mobile (AT&T, Verizon, T-Mobile)
  { product_type: "proxy", id: "132", name: "1 x Mobile Proxy - 1 Day",    price: 20.00 },
  { product_type: "proxy", id: "133", name: "1 x Mobile Proxy - 7 Days",   price: 100.00 },
  { product_type: "proxy", id: "134", name: "1 x Mobile Proxy - 30 Days",  price: 200.00 },

  # Canada In-house Mobile (Bell, Telus, Rogers)
  { product_type: "proxy", id: "inhouse-mobile-1",  name: "1 x In-house Mobile Proxy - Daily",   price: 30.00 },
  { product_type: "proxy", id: "inhouse-mobile-7",  name: "1 x In-house Mobile Proxy - 7 Days",  price: 150.00 },
  { product_type: "proxy", id: "inhouse-mobile-30", name: "1 x In-house Mobile Proxy - 30 Days", price: 300.00 },

  # ── Residential VPN (id: 14) ────────────────────────────────
  { product_type: "vpn", id: "141", name: "1 x Residential VPN - 1 day",    price: 2.00 },
  { product_type: "vpn", id: "142", name: "1 x Residential VPN - 3 days",   price: 4.00 },
  { product_type: "vpn", id: "143", name: "1 x Residential VPN - 7 days",   price: 6.00 },
  { product_type: "vpn", id: "144", name: "1 x Residential VPN - 1 month",  price: 12.00 },
  { product_type: "vpn", id: "145", name: "1 x Residential VPN - 3 months", price: 32.40 },
  { product_type: "vpn", id: "146", name: "1 x Residential VPN - 6 months", price: 57.60 },
  { product_type: "vpn", id: "147", name: "1 x Residential VPN - 12 months", price: 115.20 },

  # ── eSIM (Legacy/Working) ───────────────────────────────────
  { product_type: "esim", id: "esim-global", name: "Global eSIM", price: 18.40 },
  { product_type: "usa_esim", id: "esim-usa", name: "USA eSIM", price: 25.55 }
]

class ProductSyncer
  def sync!
    categories = ProductCategory.all.index_by(&:slug)
    synced_ids = []

    PRODUCTS.each do |prod|
      cat_slug = category_slug_for(prod)
      cat = categories[cat_slug]
      next unless cat

      product = Product.find_or_initialize_by(provider_product_id: prod[:id].to_s)
      product.assign_attributes(
        name: prod[:name],
        slug: prod[:slug] || "#{prod[:product_type]}-#{prod[:id]}",
        product_type: prod[:product_type],
        product_category: cat,
        provider: "myproxyapi",
        provider_type: "myproxyapi",
        available_to: "both",
        active: true
      )
      product.save!
      synced_ids << product.id

      # Pricing
      pricing = ProductPricing.find_or_initialize_by(product: product, currency: "USD")
      actual_api_price = prod[:product_type] == "esim" ? (prod[:price] / 10000.0) : prod[:price].to_f
      
      # Margins: Reseller (+15%), User (+30%)
      reseller_price = (actual_api_price * 1.15).round(2)
      user_price     = (actual_api_price * 1.30).round(2)

      pricing.assign_attributes(
        api_price: actual_api_price,
        reseller_selling_price: reseller_price,
        user_selling_price: user_price,
        selling_price: user_price, # Default fallback
        active: true
      )
      pricing.save!

      populate_metadata(product, prod)
    end

    # Deactivate products NOT in the synced list for relevant categories
    category_ids = categories.slice(
      'datacenter', 'isp', 'premium-isp', 'static-residential',
      'residential-rotating', 'mobile', 'residential-vpn'
    ).values.map(&:id)

    Product.where(product_category_id: category_ids)
           .where.not(id: synced_ids)
           .update_all(active: false)
  end

  private

  def category_slug_for(prod)
    name = prod[:name]
    case
    when name.match?(/Datacenter/i) then "datacenter"
    when name.match?(/Premium ISP/i) then "premium-isp"
    when name.match?(/Static Residential/i) then "static-residential"
    when name.match?(/Rotating/i) then "residential-rotating"
    when name.match?(/Mobile/i) then "mobile"
    when name.match?(/ISP Proxy/i) then "isp"
    when name.match?(/VPN/i) then "residential-vpn"
    when prod[:product_type] == "esim" then "esim"
    when prod[:product_type] == "usa_esim" then "usa_esim"
    else "residential"
    end
  end

  def populate_metadata(product, prod)
    meta = {}
    name = product.name
    category_slug = product.product_category&.slug

    # IPs Included
    if name =~ /^(\d+)\s*x/i
      meta['ips_included'] = $1.to_i
    end

    # Data limits for Rotating
    if prod[:gb_min]
      meta['gb_min'] = prod[:gb_min]
      meta['gb_max'] = prod[:gb_max]
      meta['billing_type'] = 'usage_gb'
    end

    # Category-specific metadata from JSON
    case category_slug
    when 'mobile'
      if product.provider_product_id.to_s.start_with?("inhouse")
        meta['isp'] = [
          { id: 1, name: "Bell",   slug: "bell",   locations: { "CA" => { name: "Canada", cities: [{ id: 63, name: "Toronto", state: "ON", ips_available: 9 }] } } },
          { id: 2, name: "Telus",  slug: "telus",  locations: { "CA" => { name: "Canada", cities: [{ id: 64, name: "Vancouver", state: "BC", ips_available: 5 }] } } },
          { id: 3, name: "Rogers", slug: "rogers", locations: { "CA" => { name: "Canada", cities: [{ id: 65, name: "Montreal", state: "QC", ips_available: 7 }] } } }
        ]
      else
        meta['isp'] = [
          { id: 1, slug: "ATT",     name: "AT&T",     locations: { "US" => { name: "United States", cities: [{ id: 59, name: "Ashburn", state: "VA", ips_available: 21 }] } } },
          { id: 2, slug: "VERIZON", name: "VERIZON",  locations: { "US" => { name: "United States", cities: [{ id: 38, name: "New York", state: "NY", ips_available: 185 }] } } },
          { id: 3, slug: "TMOBILE", name: "T-MOBILE", locations: { "US" => { name: "United States", cities: [{ id: 42, name: "Chicago", state: "IL", ips_available: 25 }] } } }
        ]
      end
    when 'datacenter'
      meta['isp'] = [
        { id: 1, name: "Datacenter", slug: "datacenter", locations: {
          "NL" => { name: "Netherlands", cities: [{ id: 66, name: "Amsterdam", state: "NL", ips_available: 0 }] },
          "US" => { name: "United States", cities: [
            { id: 59, name: "Ashburn", state: "VA", ips_available: 21 },
            { id: 42, name: "Chicago", state: "IL", ips_available: 25 },
            { id: 52, name: "Los Angeles", state: "CA", ips_available: 206 },
            { id: 38, name: "New York", state: "NY", ips_available: 185 }
          ]},
          "DE" => { name: "Germany", cities: [{ id: 81, name: "Berlin", state: "DE", ips_available: 210 }] },
          "GB" => { name: "United Kingdom", cities: [{ id: 57, name: "London", state: "UK", ips_available: 321 }] },
          "CA" => { name: "Canada", cities: [{ id: 63, name: "Toronto", state: "ON", ips_available: 9 }] }
        }}
      ]
    when 'isp'
      meta['isp'] = [
        { id: 10, name: "Cogent", slug: "cogent", locations: {
          "US" => { name: "United States", cities: [{ id: 62, name: "Ashburn", state: "VA", ips_available: 4 }, { id: 60, name: "Chicago", state: "IL", ips_available: 2 }] },
          "GB" => { name: "United Kingdom", cities: [{ id: 68, name: "London", state: "UK", ips_available: 0 }] }
        }},
        { id: 12, name: "Frontier", slug: "frontier", locations: {
          "US" => { name: "United States", cities: [
            { id: 84, name: "Charlotte", state: "NC", ips_available: 173 }, { id: 35, name: "Miami", state: "FL", ips_available: 112 },
            { id: 61, name: "Philadelphia", state: "PA", ips_available: 98 }, { id: 83, name: "San Jose", state: "CA", ips_available: 69 }
          ]}
        }}
      ]
    when 'premium-isp'
      meta['isp'] = [
        { id: 11, name: "Charter", slug: "charter", locations: { "US" => { name: "United States", cities: [{ id: 127, name: "Wilmington", state: "DE", ips_available: 77 }] } } },
        { id: 13, name: "Frontier", slug: "frontier", locations: { "US" => { name: "United States", cities: [{ id: 114, name: "Ashburn", state: "VA", ips_available: 167 }, { id: 117, name: "Dallas", state: "TX", ips_available: 96 }, { id: 112, name: "Denver", state: "CO", ips_available: 192 }, { id: 111, name: "Las Vegas", state: "NV", ips_available: 9 }] } } },
        { id: 5,  name: "RCN", slug: "rcn", locations: { "US" => { name: "United States", cities: [{ id: 86, name: "Ashburn", state: "VA", ips_available: 251 }] } } },
        { id: 17, name: "Spectrum", slug: "spectrum", locations: { "US" => { name: "United States", cities: [{ id: 93, name: "North Carolina", state: "NC", ips_available: 84 }, { id: 106, name: "Richmond", state: "VA", ips_available: 14 }] } } },
        { id: 9,  name: "Verizon", slug: "verizon", locations: { "US" => { name: "United States", cities: [{ id: 119, name: "New York", state: "NY", ips_available: 2 }, { id: 102, name: "Staten Island", state: "NY", ips_available: 52 }] } } },
        { id: 15, name: "Virgin Media", slug: "virgin-media", locations: { "GB" => { name: "United Kingdom", cities: [{ id: 87, name: "London", state: "UK", ips_available: 33 }] } } },
        { id: 4,  name: "Windstream", slug: "windstream", locations: { "US" => { name: "United States", cities: [{ id: 131, name: "Brooklyn", state: "NY", ips_available: 192 }, { id: 130, name: "Chicago", state: "IL", ips_available: 354 }, { id: 72, name: "Miami", state: "FL", ips_available: 172 }, { id: 132, name: "Reston", state: "VA", ips_available: 178 }, { id: 133, name: "Washington", state: "MD", ips_available: 211 }] } } }
      ]
    when 'static-residential'
      meta['isp'] = [
        { id: 7, name: "Verizon", slug: "verizon", locations: { "US" => { name: "United States", cities: [{ id: 136, name: "Brooklyn", state: "NY", ips_available: 136 }, { id: 134, name: "Cambridge", state: "MA", ips_available: 148 }, { id: 135, name: "Cleveland", state: "TN", ips_available: 129 }, { id: 105, name: "Fairfield", state: "CA", ips_available: 284 }, { id: 123, name: "Naperville", state: "IL", ips_available: 86 }, { id: 129, name: "New York", state: "NY", ips_available: 92 }, { id: 122, name: "Richmond", state: "VA", ips_available: 98 }] } } },
        { id: 16, name: "Virgin Media", slug: "virgin-media", locations: { "GB" => { name: "United Kingdom", cities: [{ id: 125, name: "London", state: "UK", ips_available: 297 }] } } }
      ]
    when 'residential-vpn'
      meta['isp'] = [
        { id: 18, name: "Spectrum", slug: "spectrum", locations: { "US" => { name: "United States", cities: [{ id: 93, name: "North Carolina", state: "NC", ips_available: 84 }, { id: 106, name: "Richmond", state: "VA", ips_available: 14 }] } } }
      ]
    end

    product.update!(metadata: meta)
  end
end

ProductSyncer.new.sync!
puts "✅ Sync complete. Old products deactivated."

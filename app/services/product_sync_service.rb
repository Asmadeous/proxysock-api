# frozen_string_literal: true

class ProductSyncService
  def initialize(logger = Rails.logger)
    @client = MyProxyApiClient.new
    @logger = logger
  end

  def sync_all_products
    @logger.info('[ProductSyncService] Starting sync...')

    # Datacenter
    sync_category('datacenter', 'proxy') { @client.fetch_products_datacenter }
    
    # ISP
    sync_category('isp', 'proxy') { @client.fetch_products_isp }
    
    # Static Residential
    sync_category('static-residential', 'proxy') { @client.fetch_products_static_residential }
    
    # Residential VPN
    sync_category('residential-vpn', 'vpn') { @client.fetch_products_residential_vpn }
    
    # Residential Rotating
    sync_category('residential-rotating', 'proxy') { @client.fetch_products_residential_rotating }
    
    # Premium ISP
    sync_category('premium-isp', 'proxy') { @client.fetch_products_premium_isp }
    
    # Mobile
    sync_category('mobile', 'proxy') { @client.fetch_products_mobile }

    @logger.info('[ProductSyncService] Sync completed.')
  end

  private

  def sync_category(category_slug, product_type)
    category = ProductCategory.find_or_create_by!(slug: category_slug) do |c|
      c.name = category_slug.titleize
      c.available_to = 'both'
      c.category_type = product_type
    end

    begin
      data_list = yield
      @logger.info("Category #{category_slug} returned #{data_list.size} items")
      
      data_list.each do |data|
        sync_product(category, data, product_type)
      end
    rescue StandardError => e
      @logger.error("Failed to sync category #{category_slug}: #{e.message}")
    end
  end

  def sync_product(category, data, product_type)
    provider_id = (data['id'] || data['api_id']).to_s
    return if provider_id.blank?

    product = Product.find_or_initialize_by(
      provider: 'myproxyapi',
      provider_product_id: provider_id
    )

    product.assign_attributes(
      name: data['name'] || "#{category.name} Plan #{provider_id}",
      description: data['description'] || data['text'],
      product_category: category,
      product_type: product_type,
      available_to: 'both',
      active: true,
      slug: data['slug'] || "myproxyapi-#{category.slug}-#{provider_id}",
      metadata: (product.metadata || {}).merge(data.except('id', 'name', 'price', 'pricing'))
    )

    product.save!

    # Sync pricing
    sync_pricing(product, data)
  end

  def sync_pricing(product, data)
    # The API might return 'price' or a list 'pricing'
    # Based on general knowledge of these reseller APIs, they often have multiple durations.
    prices = if data['pricing'].is_a?(Array)
               data['pricing']
             elsif data['price']
               [{ 'price' => data['price'], 'duration_type' => 'months', 'duration_value' => 1 }]
             else
               []
             end

    prices.each do |p|
      duration_v = p['duration_value'] || p['period'] || 1
      duration_t = p['duration_type'] || 'months'
      
      # We attempt to find the matching pricing record.
      pricing = product.product_pricings.find_or_initialize_by(
        duration_value: duration_v,
        duration_type: duration_t
      )

      # Assume api_price is USD.
      api_price = (p['price'] || p['amount']).to_f
      
      pricing.assign_attributes(
        api_price: api_price,
        currency: 'USD',
        active: true,
        # Default margin of 10% if not set or just used for calculation
        margin_percentage: pricing.margin_percentage || 10.0,
        cost_price: api_price
      )

      # Logic for selling price if not already set or simple markup
      pricing.selling_price = (api_price * 1.1) if pricing.selling_price.to_f == 0.0
      pricing.user_selling_price = pricing.selling_price if pricing.user_selling_price.to_f == 0.0
      pricing.reseller_selling_price = pricing.selling_price * 0.9 if pricing.reseller_selling_price.to_f == 0.0

      pricing.save!
    end
  end
end

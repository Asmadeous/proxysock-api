# frozen_string_literal: true

class ProductSyncService
  def initialize(logger = Rails.logger)
    @client = MyProxyApiClient.new
    @logger = logger
  end

  # Map common country names/slugs to 2-letter ISO codes
  COUNTRY_MAP = {
    'usa' => 'US',
    'united states' => 'US',
    'canada' => 'CA',
    'germany' => 'DE',
    'united kingdom' => 'GB',
    'uk' => 'GB',
    'netherlands' => 'NL',
    'holland' => 'NL',
    'france' => 'FR',
    'italy' => 'IT',
    'spain' => 'ES',
    'brazil' => 'BR',
    'australia' => 'AU',
    'india' => 'IN',
    'japan' => 'JP',
    'china' => 'CN',
    'turkey' => 'TR',
    'russia' => 'RU',
    'nigeria' => 'NG'
  }.freeze

  def sync_all_products
    @logger.info('[ProductSyncService] Starting sync...')

    # 1. Cleanup: Remove products with no orders, deactivate others
    cleanup_previous_plans

    # 2. Sync ONLY Proxy and VPN categories
    categories = %w[datacenter isp static-residential residential-vpn residential-rotating premium-isp mobile]
    
    categories.each do |cat_slug|
      sync_category(cat_slug)
    end

    @logger.info('[ProductSyncService] Sync completed.')
  end

  private

  def cleanup_previous_plans
    @logger.info('[ProductSyncService] Cleaning up previous plans...')
    
    my_products = Product.where(provider: 'myproxyapi')
    
    my_products.find_each do |product|
      pricing_ids = product.product_pricings.pluck(:id)
      
      has_total_orders = Order.where(product_id: product.id).exists? || 
                         Order.where(product_pricing_id: pricing_ids).exists?
      
      if has_total_orders
        product.update_columns(active: false)
        product.product_pricings.update_all(active: false)
      else
        product.destroy
      end
    end
  end

  def sync_category(category_slug)
    product_type = (category_slug == 'residential-vpn' ? 'vpn' : 'proxy')
    
    category = ProductCategory.find_or_create_by!(slug: category_slug) do |c|
      c.name = category_slug.titleize
      c.available_to = 'both'
      c.category_type = product_type
    end

    begin
      data = @client.fetch_category_data(category_slug)
      plans = data['proxy_plans'] || []
      isps = data['isp'] || []
      
      @logger.info("Category #{category_slug} returned #{plans.size} plans and #{isps.size} ISPs")

      plans.each do |plan|
        sync_product(category, plan, isps, product_type)
      end
    rescue StandardError => e
      @logger.error("Failed to sync category #{category_slug}: #{e.message}")
      @logger.error(e.backtrace&.first(10)&.join("\n"))
    end
  end

  def sync_product(category, plan, category_isps, product_type)
    provider_id = plan['id'].to_s
    return if provider_id.blank?

    product = Product.find_or_initialize_by(
      provider: 'myproxyapi',
      provider_product_id: provider_id
    )

    product.assign_attributes(
      name: plan['name'],
      product_category: category,
      product_type: product_type,
      available_to: 'both',
      active: true,
      slug: "myproxyapi-#{category.slug}-#{provider_id}",
      metadata: build_metadata(plan, category_isps)
    )

    product.save!
    sync_pricing(product, plan)
  end

  def build_metadata(plan, category_isps)
    meta = {}
    meta['ips_included'] = plan['ips_included'].to_i if plan['ips_included']
    meta['gb_min'] = plan['gb_min'].to_i if plan['gb_min']
    meta['gb_max'] = plan['gb_max'].to_i if plan['gb_max']
    meta['price_info'] = plan['price_info'] if plan['price_info']
    meta['billing_type'] = plan['gb_min'] ? 'usage_gb' : 'monthly'

    # Filter/Attach ISPs to the plan
    # If the plan has its own ISPs (like Mobile), use them. 
    # Otherwise use category-level ISPs.
    plan_isps = plan['isp'] || category_isps
    meta['isp'] = plan_isps

    # IMPORTANT: The frontend uses the actual keys from the 'locations' hash 
    # as the location ID for place_order and flag display.
    # We should NOT attempt to override them with ISO codes if the API uses something else.
    
    meta
  end

  def sync_pricing(product, plan)
    api_price = plan['price'].to_f
    return if api_price <= 0

    currency = plan['currency'] || 'USD'

    pricing = product.product_pricings.find_or_initialize_by(currency: currency)

    pricing.assign_attributes(
      api_price: api_price,
      cost_price: api_price,
      active: true,
      duration_type: 'months',
      duration_value: 1,
      margin_percentage: 0
    )

    # Margins: Reseller gets +15%, End-user gets +30%
    reseller_price = (api_price * 1.15).round(2)
    user_price     = (api_price * 1.30).round(2)

    pricing.selling_price = user_price
    pricing.reseller_selling_price = reseller_price
    pricing.user_selling_price = user_price

    pricing.save!
  end
end

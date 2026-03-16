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
    categories = %w[datacenter isp static-residential residential-vpn residential-rotating premium-isp mobile global-isp]

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
    # Map category slugs to normalized product types
    type_mapping = {
      'residential-vpn' => 'vpn',
      'static-residential' => 'static_residential',
      'residential-rotating' => 'residential_rotating',
      'premium-isp' => 'premium_isp',
      'global-isp' => 'global_isp'
    }

    product_type = type_mapping[category_slug] || category_slug.gsub('-', '_')

    category = ProductCategory.find_or_create_by!(slug: category_slug) do |c|
      c.name = category_slug.titleize
      c.available_to = 'both'
      c.category_type = product_type
    end

    begin
      data = @client.fetch_category_data(category_slug)

      # For global-isp, we also need to fetch configuration details to get countries/locations
      global_isp_config = nil
      if category_slug == 'global-isp'
        begin
          global_isp_config = @client.fetch_global_isp_config['data']
        rescue StandardError => e
          @logger.warn("Could not fetch global-isp config: #{e.message}")
        end
      end

      # Handle if data is directly an array (some endpoints might do this)
      if data.is_a?(Array)
        plans = data.flat_map { |item| item['proxy_plans'] || (item['id'] ? [item] : []) }
        isps = data.flat_map { |item| item['isp'] || [] }.uniq
      else
        plans = data['proxy_plans'] || []
        isps = data['isp'] || []
      end

      @logger.info("Category #{category_slug} returned #{plans.size} plans and #{isps.size} ISPs")

      plans.each do |plan|
        # Enrich plan with global_isp_config if available
        if global_isp_config && category_slug == 'global-isp'
          plan['global_isp_config'] = global_isp_config
        end
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
    plan_isps = plan['isp'] || category_isps
    meta['isp'] = plan_isps

    # Extract Country Code from Name or metadata
    plan_name = plan['name'].to_s
    plan_name_lower = plan_name.downcase

    # Try to find a country in the name
    matched_country = COUNTRY_MAP.keys.find { |country| plan_name_lower.include?(country) }
    meta['country_code'] = COUNTRY_MAP[matched_country] if matched_country

    # If not found in name, check if locations exist and try to derive from there
    if meta['country_code'].blank? && plan['locations'].present?
      # If locations is a hash or array, we might be able to extract it
      # In many cases, it's just an ID string, but sometimes names appear.
    end

    # Parse Global ISP quantity ranges from product name.
    # Examples: "1 x Global ISP" → qty_min=1, qty_max=1
    #           "10-19 x Global ISP" → qty_min=10, qty_max=19
    #           "2000 x Global ISP" → qty_min=2000, qty_max=999999 (open-ended)
    if plan_name.match?(/\d+.*x\s+Global\s+ISP/i)
      range_match = plan_name.match(/(\d+)-(\d+)\s*x/i)
      single_match = plan_name.match(/(\d+)\s*x/i)

      if range_match
        meta['qty_min'] = range_match[1].to_i
        meta['qty_max'] = range_match[2].to_i
      elsif single_match
        qty_val = single_match[1].to_i
        if qty_val == 1
          meta['qty_min'] = 1
          meta['qty_max'] = 1
        else
          # Open-ended upper tier (e.g. "2000 x") — no upper bound
          meta['qty_min'] = qty_val
          meta['qty_max'] = 999_999
        end
      end
    end

    # Extract locations if available
    meta['locations'] = plan['locations'] if plan['locations']
    # If this is Global ISP, extract countries and targets from the config
    if plan['global_isp_config']
      # plan['global_isp_config'] structure: { "target": [...], "country": [...], "period": [...] }
      config = plan['global_isp_config']
      countries_data = config['country'] || []
      meta['countries'] = countries_data

      # Map the first country as the primary flag/code
      if countries_data.any?
        first_country = countries_data.first
        meta['country_code'] = alpha3_to_alpha2(first_country['alpha3']) || meta['country_code']
      end
      # Filter periods to only keep 30 days (per user request)
      filtered_periods = (config['period'] || []).select { |p| p['name']&.to_s&.include?('30') }

      meta['periods'] = filtered_periods
      meta['targets'] = config['target']
      meta['countries'] = config['country']

      # Build the config specifically for the frontend plural requirements
      meta['global_isp_config'] = {
        'countries' => config['country'] || [],
        'targets' => config['target'] || [],
        'periods' => filtered_periods
      }
      meta['config'] = meta['global_isp_config'] # Sync legacy key
    end

    meta['targetSectionId'] = plan['targetSectionId'] if plan['targetSectionId']
    meta['targetId'] = plan['targetId'] if plan['targetId']
    meta['resi'] = plan['resi'] if plan['resi']
    meta['type'] = plan['type'] if plan['type']

    meta
  end

  def alpha3_to_alpha2(alpha3)
    return nil if alpha3.blank?

    # Simple mapping for common countries in the API
    {
      'AUT' => 'AT', 'BRA' => 'BR', 'CAN' => 'CA', 'FRA' => 'FR',
      'DEU' => 'DE', 'HKG' => 'HK', 'IND' => 'IN', 'ISR' => 'IL',
      'ITA' => 'IT', 'JPN' => 'JP', 'LVA' => 'LV', 'NLD' => 'NL',
      'POL' => 'PL', 'ROU' => 'RO', 'SGP' => 'SG', 'KOR' => 'KR',
      'ESP' => 'ES', 'TWN' => 'TW', 'THA' => 'TH', 'TUR' => 'TR',
      'UKR' => 'UA', 'USA' => 'US', 'GBR' => 'GB'
    }[alpha3.upcase] || alpha3[0..1].upcase
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

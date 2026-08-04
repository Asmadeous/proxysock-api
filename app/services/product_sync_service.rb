# frozen_string_literal: true

class ProductSyncService
  def initialize(logger = Rails.logger)
    @client = MyProxyApiClient.new
    @logger = logger
  end

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

  # Hardcoded rotation options for residential rotating
  ROTATION_OPTIONS = [
    { value: '0', label: 'Always Rotate (New IP per request)', minutes: 0 },
    { value: '3', label: 'Sticky 3 Minutes', minutes: 3 },
    { value: '5', label: 'Sticky 5 Minutes', minutes: 5 },
    { value: '30', label: 'Sticky 30 Minutes', minutes: 30 },
    { value: '60', label: 'Sticky 1 Hour', minutes: 60 },
    { value: '240', label: 'Sticky 4 Hours', minutes: 240 },
    { value: '1440', label: 'Sticky 24 Hours', minutes: 1440 }
  ].freeze

  HOSTNAME_OPTIONS = [
    { value: 'ip-na.myproxyapi.com', label: 'North America', region: 'NA' },
    { value: 'ip-eu.myproxyapi.com', label: 'Europe', region: 'EU' },
    { value: 'ip-asia.myproxyapi.com', label: 'Asia', region: 'ASIA' }
  ].freeze

  def sync_all_products
    @logger.info('[ProductSyncService] Starting sync...')

    # 1. Cleanup: Remove products with no orders, deactivate others
    cleanup_previous_plans

    # 2. Sync ONLY Proxy categories
    # 'mobile' = MyProxyApi USA mobile proxies (provisioned via MyProxyApi, not LocalToNet).
    categories = %w[datacenter isp static-residential residential-vpn residential-rotating premium-isp global-isp mobile]

    categories.each do |cat_slug|
      sync_category(cat_slug)
    end

    # 3. Sync Residential Rotating configuration (countries, states, cities, isps)
    sync_residential_rotating_config

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

  # NEW: Sync Residential Rotating configuration
  def sync_residential_rotating_config
    @logger.info('[ProductSyncService] Syncing Residential Rotating configuration...')

    # Populate the rr_* geo tables (countries/states/isps) that the storefront
    # country/state/ISP dropdowns actually read from. This is the source of truth
    # for those dropdowns — the category metadata below is only legacy payload.
    # Heavy + provider-rate-limited, and this method also runs in a synchronous
    # admin request, so it runs in a background job rather than inline.
    ResidentialRotatingGeoSyncJob.perform_later
    @logger.info('[ProductSyncService] Enqueued ResidentialRotatingGeoSyncJob (rr_* geo tables)')

    category = ProductCategory.find_by(slug: 'residential-rotating')
    return unless category

    begin
      # Geographic data (countries/states/cities/isps) comes from MyProxyApi's
      # read-only get-* endpoints (no balance cost). Preserve any existing data if
      # the fetch fails or returns empty so we never wipe a good config.
      existing_countries = category.metadata&.dig('residential_rotating_config', 'countries') || []
      # Flat country list only (one read call). The nested states/cities/isps per
      # country would be thousands of calls and hit the rate limit, so those are
      # left for lazy on-demand loading. country_code is the alpha2 the
      # generate-proxy `country` param expects (e.g. "br").
      countries = begin
        (@client.fetch_residential_rotating_countries || []).map do |c|
          code = (c['country_code'] || c['code']).to_s
          { 'id' => code, 'name' => c['country_name'] || c['name'], 'code' => code, 'alpha2' => code }
        end.presence || existing_countries
      rescue StandardError => e
        @logger.error("[ProductSyncService] RR countries fetch failed, keeping existing: #{e.message}")
        existing_countries
      end

      config = {
        countries: countries,
        rotation_options: ROTATION_OPTIONS,
        hostname_options: HOSTNAME_OPTIONS,
        synced_at: Time.current.iso8601
      }

      # Store in ProductCategory metadata
      category.update!(metadata: (category.metadata || {}).merge(residential_rotating_config: config))

      @logger.info('[ProductSyncService] Residential Rotating config synced successfully')
    rescue StandardError => e
      @logger.error("[ProductSyncService] Failed to sync Residential Rotating config: #{e.message}")
      @logger.error(e.backtrace&.first(10)&.join("\n"))
    end
  end

  # Fetch countries and their states/cities/isps from MyProxyApi
  def fetch_residential_rotating_countries
    countries_data = @client.fetch_residential_rotating_countries

    (countries_data || []).map do |country|
      country_code = country['country_code'] || country['code'] || country['id']

      {
        id: country_code,
        name: country['country_name'] || country['name'],
        code: country['country_code'] || country['code'] || country_code,
        alpha2: country['alpha2'] || country_code,
        alpha3: country['alpha3'] || country_code,
        states: fetch_residential_rotating_states(country_code),
        isps: fetch_residential_rotating_isps(country_code)
      }
    end
  end

  # Fetch states for a specific country
  # Fetch states for a specific country
  def fetch_residential_rotating_states(country_code)
    states_data = @client.fetch_residential_rotating_states(country_code)

    (states_data || []).map do |state|
      state_slug = state['code'] || state['id'] || state['slug']

      # If cities are already nested in the state response, use them.
      # Otherwise, fetch them separately.
      cities = if state['cities'].is_a?(Array) && state['cities'].any?
                 state['cities'].map do |city|
                   {
                     id: city['code'] || city['id'] || city['slug'],
                     name: city['name'],
                     state: state_slug,
                     country_code: country_code
                   }
                 end
               else
                 fetch_residential_rotating_cities(country_code, state_slug)
               end

      {
        id: state_slug,
        name: state['name'],
        code: state['code'] || state_slug,
        country_code: country_code,
        cities: cities
      }
    end
  end

  # Fetch cities for a specific state
  def fetch_residential_rotating_cities(country_code, state_slug)
    cities_data = @client.fetch_residential_rotating_cities(country_code, state_slug)

    (cities_data || []).map do |city|
      {
        id: city['code'] || city['id'] || city['slug'],
        name: city['name'],
        state: state_slug,
        country_code: country_code
      }
    end
  end

  # Fetch ISPs for a specific country
  def fetch_residential_rotating_isps(country_code)
    isps_data = @client.fetch_residential_rotating_isps(country_code)

    (isps_data || []).map do |isp|
      {
        id: isp['id'] || isp['code'],
        name: isp['name'],
        code: isp['code'] || isp['id'],
        country_code: country_code
      }
    end
  end

  def sync_category(category_slug)
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

      global_isp_config = nil
      if category_slug == 'global-isp'
        begin
          global_isp_config = @client.fetch_global_isp_config['data']
        rescue StandardError => e
          @logger.warn("Could not fetch global-isp config: #{e.message}")
        end
      end

      if data.is_a?(Array)
        plans = data.flat_map { |item| item['proxy_plans'] || (item['id'] ? [item] : []) }
        isps = data.flat_map { |item| item['isp'] || [] }.uniq
      else
        plans = data['proxy_plans'] || []
        isps = data['isp'] || []
      end

      @logger.info("Category #{category_slug} returned #{plans.size} plans and #{isps.size} ISPs")

      plans.each do |plan|
        if global_isp_config && category_slug == 'global-isp'
          plan['global_isp_config'] = global_isp_config
        end
        # Force resi = 1 for all residential-rotating plans (provider API doesn't send it)
        # if category_slug == 'residential-rotating'
        #   plan['resi'] = 1
        # end
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

    plan_isps = plan['isp'] || category_isps
    meta['isp'] = plan_isps

    plan_name = plan['name'].to_s
    plan_name_lower = plan_name.downcase

    matched_country = COUNTRY_MAP.keys.find { |country| plan_name_lower.include?(country) }
    meta['country_code'] = COUNTRY_MAP[matched_country] if matched_country

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
          meta['qty_min'] = qty_val
          meta['qty_max'] = 999_999
        end
      end
    end

    meta['locations'] = plan['locations'] if plan['locations']

    if plan['global_isp_config']
      config = plan['global_isp_config']
      countries_data = config['country'] || []
      meta['countries'] = countries_data

      if countries_data.any?
        first_country = countries_data.first
        meta['country_code'] = alpha3_to_alpha2(first_country['alpha3']) || meta['country_code']
      end

      filtered_periods = (config['period'] || []).select { |p| p['name']&.to_s&.include?('30') }

      meta['periods'] = filtered_periods
      meta['targets'] = config['target']
      meta['countries'] = config['country']

      meta['global_isp_config'] = {
        'countries' => config['country'] || [],
        'targets' => config['target'] || [],
        'periods' => filtered_periods
      }
      meta['config'] = meta['global_isp_config']
    end

    meta['targetSectionId'] = plan['targetSectionId'] if plan['targetSectionId']
    meta['targetId'] = plan['targetId'] if plan['targetId']
    meta['resi'] = plan['resi'] if plan['resi']
    meta['type'] = plan['type'] if plan['type']

    meta
  end

  def alpha3_to_alpha2(alpha3)
    return nil if alpha3.blank?

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

    # Markup: reseller +20%, user +40% over API cost
    reseller_price = (api_price * 1.20).round(2)
    user_price     = (api_price * 1.40).round(2)

    pricing.selling_price = reseller_price
    pricing.reseller_selling_price = reseller_price
    pricing.user_selling_price = user_price

    pricing.save!
  end
end

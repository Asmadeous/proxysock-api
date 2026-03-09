# frozen_string_literal: true

class EsimSyncService
  BATCH_SIZE = 10 # API limit for usage query

  def initialize(logger = Rails.logger)
    @client = EsimAccessService.new
    @logger = logger
  end

  def sync_packages!
    @logger.info('[EsimSyncService] Starting package sync...')

    # Deactivate existing esim_access products to ensure fresh state
    Product.where(provider: 'esim_access').update_all(active: false)

    category = ProductCategory.find_or_create_by!(slug: 'esim') do |c|
      c.name = 'eSIM'
      c.available_to = 'both'
      c.category_type = 'esim'
    end

    # Sync Base Packages
    base_packages = @client.list_packages(type: 'BASE')
    @logger.info("[EsimSyncService] Found #{base_packages.size} base packages from API")

    base_packages.each do |pkg|
      sync_product(category, pkg, 'base')
    rescue StandardError => e
      @logger.error("Failed to sync base package #{pkg['packageCode']}: #{e.message}")
    end

    # Sync Top-up Packages
    topup_packages = @client.list_packages(type: 'TOPUP')
    @logger.info("[EsimSyncService] Found #{topup_packages.size} top-up packages from API")

    topup_packages.each do |pkg|
      sync_product(category, pkg, 'topup')
    rescue StandardError => e
      @logger.error("Failed to sync top-up package #{pkg['packageCode']}: #{e.message}")
    end

    @logger.info('[EsimSyncService] Package sync completed.')
  end

  def sync_usage!
    active_esims = Esim.where(esim_provider: 'esim_access', status: 'active').where.not(iccid: nil)

    active_esims.each_slice(BATCH_SIZE) do |batch|
      batch.each do |esim|
        details = @client.fetch_esim_details(esim.iccid)
        if details
          update_esim(esim, details)
        end
      rescue StandardError => e
        @logger.error("Failed to sync eSIM #{esim.iccid}: #{e.message}")
      end
    end
  end

  private

  def sync_product(category, pkg, package_type)
    # The API uses packageCode or slug. Prefer slug if available.
    provider_id = pkg['slug'].presence || pkg['packageCode']
    
    product = Product.find_or_initialize_by(
      provider: 'esim_access',
      provider_product_id: provider_id
    )

    # Docs say price is value * 10,000 (e.g. 10000 = $1.00)
    api_price = (pkg['price'].to_f / 10000.0).round(2)

    product.assign_attributes(
      name: pkg['name'],
      description: pkg['description'],
      product_category: category,
      product_type: 'esim',
      provider_type: 'esim_access',
      available_to: 'both',
      active: true,
      slug: "esim-#{package_type}-#{provider_id.downcase.gsub('_', '-')}",
      metadata: build_metadata(pkg, api_price, package_type)
    )

    product.save!
    sync_pricing(product, pkg, api_price)
  end

  def build_metadata(pkg, api_price, package_type)
    # Use existing metadata structure
    {
      'package_code' => pkg['packageCode'],
      'slug' => pkg['slug'],
      'location_name' => pkg['locationName'] || pkg['location'],
      'location_code' => pkg['locationCode'],
      'duration' => pkg['duration'],
      'duration_unit' => pkg['durationUnit'],
      'volume_bytes' => pkg['volume'],
      'data_gb' => (pkg['volume'].to_f / 1.gigabyte).round(2),
      'api_price' => api_price,
      'data_type' => pkg['dataType'],
      'sms_status' => pkg['smsStatus'],
      'speed' => pkg['speed'] || '4G/5G',
      'location_network_list' => pkg['locationNetworkList'],
      'package_type' => package_type
    }
  end

  def sync_pricing(product, pkg, api_price)
    currency = pkg['currencyCode'] || 'USD'
    pricing = product.product_pricings.find_or_initialize_by(currency: currency)

    pricing.assign_attributes(
      api_price: api_price,
      cost_price: api_price,
      active: true,
      duration_type: pkg['durationUnit'] == 'DAY' ? 'days' : 'months',
      duration_value: pkg['duration'],
      margin_percentage: 0 # We set selling prices directly
    )

    # Margins: End-user +30%, Reseller +15%
    reseller_price = (api_price * 1.15).round(2)
    user_price     = (api_price * 1.30).round(2)

    pricing.selling_price = user_price
    pricing.user_selling_price = user_price
    pricing.reseller_selling_price = reseller_price

    pricing.save!
  end

  def update_esim(esim, data)
    used = data['dataUsage'].to_i
    total = data['totalData'].to_i

    esim.update(
      data_used_bytes: used,
      data_total_bytes: total
    )

    return unless total.positive? && used >= total
    esim.update(status: 'used_up')
  end
end

# frozen_string_literal: true

# Syncs the MeiSIM catalogue into `esim` products. New plans go live on creation;
# an existing product keeps its active flag so staff can switch plans off.
class MeisimCatalogSyncService
  PROVIDER = 'meisim'
  US_PREPAID_PREFIXES = %w[p3: ly:].freeze
  USER_MARKUP = 1.20
  DEALER_COSTS_PATH = Rails.root.join('config/meisim_dealer_costs.yml')

  def initialize(client: MeisimService.new, logger: Rails.logger)
    @client = client
    @logger = logger
  end

  def sync!
    plans = @client.products.select { |plan| plan['productCategory'] == 'esim_realtime' }
    category = esim_category
    synced_ids = []

    plans.each do |plan|
      sync_plan(category, plan)
      synced_ids << plan['productId']
    rescue StandardError => e
      @logger.error("[MeisimCatalogSync] Skipped #{plan['productId']}: #{e.message}")
    end

    deactivate_missing(synced_ids)
    @logger.info("[MeisimCatalogSync] Synced #{synced_ids.size} of #{plans.size} plans")
    synced_ids.size
  end

  private

  def esim_category
    ProductCategory.find_or_create_by!(slug: 'esim') do |c|
      c.name = 'eSIM'
      c.available_to = 'both'
      c.category_type = 'esim'
    end
  end

  def sync_plan(category, plan)
    product_id = plan.fetch('productId')
    details = plan_details(plan)
    product = Product.find_or_initialize_by(provider: PROVIDER, provider_product_id: product_id)

    product.assign_attributes(
      name: details['PLAN_TITLE'].presence || product_id,
      product_category: category,
      product_type: 'esim',
      provider_type: PROVIDER,
      available_to: 'both',
      slug: "meisim-#{product_id.parameterize}",
      metadata: build_metadata(plan, details, product_id)
    )
    product.active = true if product.new_record?

    Product.transaction do
      product.save!
      sync_pricing(product, plan.fetch('retailPrice').to_d, product_id)
    end
  end

  def plan_details(plan)
    Array(plan['productDetails']).to_h { |d| [d['name'].to_s.strip, d['value']] }
  end

  def build_metadata(plan, details, product_id)
    us_prepaid = product_id.start_with?(*US_PREPAID_PREFIXES)
    network = details['PLAN_NETWORK'].presence || details['NETWORKS_SHORT'].presence || plan['providerName']
    requires_imei = MeisimDeviceDetails.device_required?(product_id)

    {
      'meisim_line' => us_prepaid ? 'us_prepaid' : 'travel',
      'esim_type' => us_prepaid ? 'voice_data_sms' : 'data_only',
      'countries' => Array(plan['countries']).grep(/\A[A-Z]{2}\z/),
      'regions' => Array(plan['regions']),
      'network' => network,
      'requires_imei' => requires_imei,
      'requires_eid' => requires_imei && MeisimDeviceDetails.eid_required?(network),
      'provider_name' => plan['providerName'],
      'data_limit' => details['PLAN_DATA_LIMIT'],
      'data_unit' => details['PLAN_DATA_UNIT'],
      'validity_days' => details['VALIDITY_IN_DAYS']&.to_i,
      'retail_price' => plan['retailPrice'],
      'usage_tracking' => details['USAGE_TRACKING'],
      'synced_at' => Time.current.iso8601
    }
  end

  # Resellers pay MeiSIM retail; users pay retail + 20%.
  def sync_pricing(product, retail, product_id)
    pricing = product.product_pricings.find_or_initialize_by(currency: 'USD')

    pricing.update!(
      api_price: retail,
      cost_price: dealer_costs[product_id],
      selling_price: retail,
      reseller_selling_price: retail,
      user_selling_price: (retail * USER_MARKUP).round(2),
      margin_percentage: 0,
      active: true
    )
  end

  def dealer_costs
    @dealer_costs ||= YAML.load_file(DEALER_COSTS_PATH).transform_values(&:to_d)
  end

  # An empty result is treated as an upstream glitch, not a delisting of every plan.
  # update_all skips timestamps, so bump updated_at to keep the catalog cache honest.
  def deactivate_missing(synced_ids)
    return if synced_ids.empty?

    Product.where(provider: PROVIDER, active: true)
           .where.not(provider_product_id: synced_ids)
           .update_all(active: false, updated_at: Time.current)
  end
end

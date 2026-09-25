# frozen_string_literal: true

# Syncs the MeiSIM catalogue into `esim` products. New plans go live on creation;
# an existing product keeps its active flag so staff can switch plans off.
class MeisimCatalogSyncService
  PROVIDER = 'meisim'
  US_PREPAID_PREFIXES = %w[p3: ly:].freeze
  # Markup on MeiSIM retail by retail price: [tier starts at, markup]. Cheap plans
  # get a bigger percentage so they still earn a real margin.
  CUSTOMER_MARKUP_TIERS = [[0, 0.50], [15, 0.30], [30, 0.20]].freeze
  RESELLER_MARKUP_TIERS = [[0, 0.25], [15, 0.15], [30, 0.10]].freeze
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
      name: plan_name(details['PLAN_TITLE']).presence || product_id,
      description: plan_description(details),
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

  # Titles lead with the carrier's list price ("Lycamobile · $19 Unlimited International
  # Plan"), which would expose MeiSIM's cost. The stored name drops it, and
  # `name_template` marks where Product#display_name puts the viewer's own price.
  TITLE_PRICE = /\A\$\d+(?:\.\d+)?(\s*-?\s*)/.freeze

  def plan_name(title)
    title.to_s.split(' · ').map { |part| part.sub(TITLE_PRICE, '') }.join(' · ')
  end

  def name_template(title)
    template = title.to_s.split(' · ').map { |part| part.sub(TITLE_PRICE) { "#{Product::NAME_PRICE_TOKEN}#{Regexp.last_match(1)}" } }.join(' · ')
    template unless template == title.to_s
  end

  # MeiSIM fills unknown values with "", "0" or "None"; "0" minutes also appears on
  # plans whose description includes calls, so it is treated as unknown.
  def detail_value(details, name)
    value = details[name].to_s.strip
    value unless value.empty? || %w[0 None].include?(value)
  end

  # Some descriptions only repeat the title, which the card already shows.
  def plan_description(details)
    description = detail_value(details, 'PLAN_DESCRIPTION')
    description unless description.nil? || details['PLAN_TITLE'].to_s.include?(description)
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
      'name_template' => name_template(details['PLAN_TITLE']),
      'voice' => detail_value(details, 'VOICE'),
      'sms' => detail_value(details, 'SMS'),
      'coverage' => detail_value(details, 'PLAN_COVERAGE'),
      'activation_note' => detail_value(details, 'ACTIVATION_NOTE'),
      'warnings' => detail_value(details, 'WARNINGS'),
      'synced_at' => Time.current.iso8601
    }
  end

  def sync_pricing(product, retail, product_id)
    pricing = product.product_pricings.find_or_initialize_by(currency: 'USD')

    pricing.update!(
      api_price: retail,
      cost_price: dealer_costs[product_id],
      selling_price: retail,
      reseller_selling_price: marked_up(retail, RESELLER_MARKUP_TIERS),
      user_selling_price: marked_up(retail, CUSTOMER_MARKUP_TIERS),
      margin_percentage: 0,
      active: true
    )
  end

  # A plan never costs less than the top of the tier below it, so a $30 plan is not
  # cheaper than a $29.50 one that sits in the higher-markup tier.
  def marked_up(retail, tiers)
    floor = 0
    tiers.each_cons(2) do |(_, markup), (next_start, _)|
      floor = next_start * (1 + markup) if retail >= next_start
    end
    markup = tiers.reverse.find { |start, _| retail >= start }.last
    [retail * (1 + markup), floor].max.to_d.round(2)
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

# frozen_string_literal: true

# Syncs the MeiSIM catalogue into `esim` products. New plans go live on creation;
# an existing product keeps its active flag so staff can switch plans off. Plans
# the sync itself switched off because they left the catalogue come back on when
# MeiSIM lists them again.
class MeisimCatalogSyncService
  PROVIDER = 'meisim'
  DELISTED_KEY = 'delisted_by_sync'
  US_PREPAID_PREFIXES = %w[p3: ly:].freeze
  # MeiSIM's PRODUCT_TYPE for plans that come with a phone number: [meisim_line, number country].
  PHONE_LINES = { 'US_NUMBER' => %w[us_prepaid US], 'UK_NUMBER' => %w[uk_prepaid GB] }.freeze
  # MeiSIM's carrier id inside p3: product ids (p3:<carrier>:<plan>). Since 2026-09-25 some
  # plans arrive with "Carrier 8" in place of the carrier's name; the sync puts it back.
  P3_CARRIERS = { '2' => 'AT&T', '8' => 'T-Mobile', '197' => 'MobileX', '318' => 'LinkUp Mobile',
                  '445' => 'Moxee 2' }.freeze
  # Markup on MeiSIM retail by retail price: [tier starts at, markup]. Cheap plans
  # get a bigger percentage so they still earn a real margin.
  CUSTOMER_MARKUP_TIERS = [[0, 0.50], [15, 0.30], [30, 0.20]].freeze
  RESELLER_MARKUP_TIERS = [[0, 0.25], [15, 0.15], [30, 0.10]].freeze
  DEALER_COSTS_PATH = Rails.root.join('config/meisim_dealer_costs.yml')
  PRICE_OVERRIDES_PATH = Rails.root.join('config/meisim_price_overrides.yml')

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
    relisted = product.metadata.is_a?(Hash) && product.metadata[DELISTED_KEY]

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
    product.active = true if product.new_record? || relisted

    Product.transaction do
      product.save!
      sync_pricing(product, plan.fetch('retailPrice').to_d, product_id)
    end
  end

  def plan_details(plan)
    details = Array(plan['productDetails']).to_h { |d| [d['name'].to_s.strip, d['value']] }
    carrier = P3_CARRIERS[plan['productId'].to_s[/\Ap3:(\d+):/, 1]]
    return details unless carrier

    restored = details.transform_values { |value| value.is_a?(String) ? value.gsub(/\bCarrier \d+\b/, carrier) : value }
    # "Carrier 8 Prepaid · Carrier 8 5GB eSIM" -> "T-Mobile Prepaid · 5GB eSIM"
    brand, *rest = restored['PLAN_TITLE'].to_s.split(' · ')
    restored['PLAN_TITLE'] = [brand, *rest.map { |part| part.delete_prefix("#{carrier} ") }].join(' · ') if rest.any?
    restored
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
    value = raw_detail(details, name)
    value unless value == '0'
  end

  def raw_detail(details, name)
    value = details[name].to_s.strip
    value unless value.empty? || value == 'None'
  end

  # MeiSIM's description as shown on its cards, minus MeiSIM's list price where a
  # sentence starts with it ("$19 Unlimited International Plan").
  def plan_description(details)
    raw_detail(details, 'PLAN_DESCRIPTION')&.gsub(/(^|(?<=\.\s))\$\d+(?:\.\d+)?\s*-?\s*/, '')
  end

  def phone_line(details, product_id)
    PHONE_LINES[details['PRODUCT_TYPE'].to_s.strip] ||
      (PHONE_LINES['US_NUMBER'] if product_id.start_with?(*US_PREPAID_PREFIXES))
  end

  def build_metadata(plan, details, product_id)
    line, number_country = phone_line(details, product_id)
    network = details['PLAN_NETWORK'].presence || details['NETWORKS_SHORT'].presence || plan['providerName']
    requires_imei = MeisimDeviceDetails.device_required?(product_id)
    # MeiSIM marks plans that need no EID (all Lycamobile lines) with REQUIRES_EID = "NO".
    eid_waived = details['REQUIRES_EID'].to_s.strip.casecmp?('NO')

    {
      'meisim_line' => line || 'travel',
      'esim_type' => line ? 'voice_data_sms' : 'data_only',
      'number_country' => number_country,
      # MeiSIM's team activates these by hand, within 24 hours and without a QR code.
      'manual_fulfilment' => details['FULFILMENT'].to_s.strip.casecmp?('MANUAL'),
      # MeiSIM's checkout offers an activation address on every US line except Moxee.
      'accepts_address' => line == 'us_prepaid' && network.to_s !~ /moxee/i,
      'countries' => Array(plan['countries']).grep(/\A[A-Z]{2}\z/),
      'regions' => Array(plan['regions']),
      'network' => network,
      'requires_imei' => requires_imei,
      'requires_eid' => requires_imei && MeisimDeviceDetails.eid_required?(network) && !eid_waived,
      'provider_name' => plan['providerName'],
      'data_limit' => details['PLAN_DATA_LIMIT'],
      'data_unit' => details['PLAN_DATA_UNIT'],
      'validity_days' => details['VALIDITY_IN_DAYS']&.to_i,
      'retail_price' => plan['retailPrice'],
      'usage_tracking' => details['USAGE_TRACKING'],
      'name_template' => name_template(details['PLAN_TITLE']),
      # Calls and texts as MeiSIM shows them, "0" included; the storefront mirrors MeiSIM's
      # card and plan window (e.g. "Data only" when both are 0).
      'voice' => raw_detail(details, 'VOICE'),
      'sms' => raw_detail(details, 'SMS'),
      'phone_number' => raw_detail(details, 'PHONE_NUMBER'),
      'includes_number' => raw_detail(details, 'INCLUDES_NUMBER'),
      'networks' => raw_detail(details, 'NETWORKS'),
      'hotspot' => raw_detail(details, 'HOTSPOT'),
      'topup' => raw_detail(details, 'TOPUP'),
      'intl_minutes' => raw_detail(details, 'INTL_MINUTES'),
      'intl_call_to' => raw_detail(details, 'INTL_CALL_TO'),
      'roaming_free' => raw_detail(details, 'ROAMING_FREE'),
      'roaming_data_only' => raw_detail(details, 'ROAMING_DATA_ONLY'),
      'term_months' => raw_detail(details, 'TERM_MONTHS')&.to_i,
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
      reseller_selling_price: price_override(product_id, 'reseller') || marked_up(retail, RESELLER_MARKUP_TIERS),
      user_selling_price: price_override(product_id, 'customer') || marked_up(retail, CUSTOMER_MARKUP_TIERS),
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

  # Fixed prices agreed for individual plans, used instead of the tiered markup.
  def price_override(product_id, audience)
    @price_overrides ||= YAML.load_file(PRICE_OVERRIDES_PATH) || {}
    @price_overrides.dig(product_id, audience)&.to_d
  end

  # An empty result is treated as an upstream glitch, not a delisting of every plan.
  # update_all skips timestamps, so bump updated_at to keep the catalog cache honest.
  # Marks what it switches off so a later sync can tell these apart from plans
  # staff disabled. build_metadata drops the mark when the plan is synced again.
  def deactivate_missing(synced_ids)
    return if synced_ids.empty?

    Product.where(provider: PROVIDER, active: true)
           .where.not(provider_product_id: synced_ids)
           .update_all([
                         "active = false, updated_at = ?, metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(?, true)",
                         Time.current, DELISTED_KEY
                       ])
  end
end

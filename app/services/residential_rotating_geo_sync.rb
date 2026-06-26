# frozen_string_literal: true

# Syncs MyProxyApi residential-rotating geo data into dedicated DB tables so the
# storefront reads everything from the DB (never the provider on a user request).
#
# All provider endpoints used here are READ-ONLY (get-countries/states/cities/isp)
# and do NOT consume order balance.
#
#   ResidentialRotatingGeoSync.new.call          # countries + states + ISPs (main countries)
#   ResidentialRotatingGeoSync.new.cities_for(cc, state)  # lazy-cached cities
class ResidentialRotatingGeoSync
  # The client has no 429 handling, so stay under the 60 req/min cap.
  THROTTLE_SECONDS = 1.1

  def initialize(client: MyProxyApiClient.new, logger: Rails.logger)
    @client = client
    @logger = logger
  end

  def call
    countries = fetch { @client.fetch_residential_rotating_countries } || []
    upsert_countries(countries)

    RrCountry.main.pluck(:code).each do |code|
      sync_states(code)
      sync_isps(code)
    rescue StandardError => e
      @logger.error("[RRGeoSync] #{code} failed: #{e.message}")
    end

    @logger.info("[RRGeoSync] done — countries=#{RrCountry.count} states=#{RrState.count} isps=#{RrIsp.count}")
  end

  # Cities are numerous and per-state; fetch once from the provider, cache in the
  # DB, then serve from the DB on every subsequent request.
  def cities_for(country_code, state_slug)
    cc = country_code.to_s.downcase
    state = state_slug.to_s
    cached = RrCity.for_state(cc, state)
    return cached if cached.exists?

    cities = fetch { @client.fetch_residential_rotating_cities(cc, state) } || []
    now = Time.current
    rows = cities.filter_map do |c|
      slug = node_slug(c, %w[code id slug name])
      next if slug.blank?

      { country_code: cc, state_slug: state, slug: slug, name: c['name'] || slug, created_at: now, updated_at: now }
    end
    RrCity.insert_all(rows, unique_by: %i[country_code state_slug slug]) if rows.any?
    RrCity.for_state(cc, state)
  end

  private

  def fetch
    result = yield
    throttle
    result
  rescue StandardError => e
    @logger.error("[RRGeoSync] fetch failed: #{e.message}")
    throttle
    nil
  end

  def throttle
    sleep(THROTTLE_SECONDS)
  end

  # Provider responses vary in shape; pick the first present identifier, lowercased.
  def node_slug(node, keys)
    keys.each { |k| return node[k].to_s.downcase if node[k].present? }
    ''
  end

  def upsert_countries(countries)
    now = Time.current
    rows = countries.filter_map do |c|
      code = (c['country_code'] || c['code']).to_s.downcase
      next if code.blank?

      { code: code, name: c['country_name'] || c['name'] || code.upcase,
        is_main: c['is_main'].to_i == 1, synced_at: now, created_at: now, updated_at: now }
    end
    RrCountry.upsert_all(rows, unique_by: :code) if rows.any?
  end

  def sync_states(code)
    states = fetch { @client.fetch_residential_rotating_states(code) } || []
    now = Time.current
    rows = states.filter_map do |s|
      slug = node_slug(s, %w[code id slug state name])
      next if slug.blank?

      { country_code: code, slug: slug, name: s['name'] || s['state'] || slug.titleize, created_at: now, updated_at: now }
    end
    RrState.upsert_all(rows, unique_by: %i[country_code slug]) if rows.any?
  end

  def sync_isps(code)
    isps = fetch { @client.fetch_residential_rotating_isps(code) } || []
    now = Time.current
    seen = {}
    rows = isps.filter_map do |i|
      ext = (i['id'] || i['asn'] || i['name']).to_s
      next if ext.blank? || seen[ext]

      seen[ext] = true
      { country_code: code, external_id: ext, name: i['name'], asn: i['asn'], created_at: now, updated_at: now }
    end
    rows.each_slice(2000) { |batch| RrIsp.upsert_all(batch, unique_by: %i[country_code external_id]) }
  end
end

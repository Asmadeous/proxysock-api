# frozen_string_literal: true

require 'net/http'
require 'json'

# Client for the MyProxyApi reseller API.
# Handles authentication (JWT Bearer token), order placement, credential
# updates, IP rotation, and VPN OVPN download.
class MyProxyApiClient
  BASE_URL     = ENV.fetch('MY_PROXY_API_URL', 'https://reseller.myproxyapi.com/api/v1')
  API_USERNAME = ENV.fetch('MY_PROXY_API_USERNAME', '')
  API_SECRET   = ENV.fetch('MY_PROXY_API_SECRET', '')

  # The BASE_URL usually ends in /v1. We'll strip it to allow version switching.
  ROOT_URL = BASE_URL.gsub(%r{/v1/?$}, '')

  # --------------------------------------------------------------------------
  # Fetch product plans by category
  # --------------------------------------------------------------------------

  def fetch_category_data(slug)
    data = request(:get, "#{BASE_URL}/products/#{slug}")['data']
    data.is_a?(Array) ? (data.first || {}) : (data || {})
  end

  def fetch_products_datacenter
    extract_proxy_plans(request(:get, "#{BASE_URL}/products/datacenter"))
  end

  def fetch_products_isp
    extract_proxy_plans(request(:get, "#{BASE_URL}/products/isp"))
  end

  def fetch_products_static_residential
    extract_proxy_plans(request(:get, "#{BASE_URL}/products/static-residential"))
  end

  def fetch_products_residential_vpn
    extract_proxy_plans(request(:get, "#{BASE_URL}/products/residential-vpn"))
  end

  def fetch_products_residential_rotating
    extract_proxy_plans(request(:get, "#{BASE_URL}/products/residential-rotating"))
  end

  def fetch_products_premium_isp
    extract_proxy_plans(request(:get, "#{BASE_URL}/products/premium-isp"))
  end

  def fetch_products_mobile
    extract_proxy_plans(request(:get, "#{BASE_URL}/products/mobile"))
  end

  def fetch_products_global_isp
    extract_proxy_plans(request(:get, "#{ROOT_URL}/v1/products/global-isp"))
  end

  # ==========================================================================
  # Residential Rotating V2 Endpoints (COMMENTED OUT)
  # ==========================================================================

  # def fetch_v2_residential_rotating_orders
  #   request(:get, "#{ROOT_URL}/v2/orders-residential-rotating")
  # end

  # def fetch_v2_residential_rotating_order(order_id)
  #   request(:get, "#{ROOT_URL}/v2/orders-residential-rotating/#{order_id}")
  # end

  # def fetch_v2_res_rot_settings
  #   request(:get, "#{ROOT_URL}/v2/residential-rotating/get-settings")
  # end

  # def fetch_v2_res_rot_countries
  #   request(:get, "#{ROOT_URL}/v2/residential-rotating/get-countries")
  # end

  # def fetch_v2_res_rot_states(country_code)
  #   request(:get, "#{ROOT_URL}/v2/residential-rotating/get-states/#{country_code}")
  # end

  # def fetch_v2_res_rot_cities(country_code, state_slug)
  #   request(:get, "#{ROOT_URL}/v2/residential-rotating/get-cities/#{country_code}/#{state_slug}")
  # end

  # def fetch_v2_res_rot_isp(country_code)
  #   request(:get, "#{ROOT_URL}/v2/residential-rotating/get-isp/#{country_code}")
  # end

  # def generate_v2_res_rot_proxy(payload)
  #   request(:post, "#{ROOT_URL}/v2/residential-rotating/generate-proxy", payload)
  # end

  # ==========================================================================
  # Residential Rotating V1 Endpoints (Temp fallback)
  # ==========================================================================

  def fetch_v1_residential_rotating_orders
    request(:get, "#{ROOT_URL}/v1/orders-residential-rotating")
  end

  def fetch_v1_residential_rotating_order(order_id)
    request(:get, "#{ROOT_URL}/v1/orders-residential-rotating/#{order_id}")
  end

  def fetch_v1_res_rot_settings
    request(:get, "#{ROOT_URL}/v1/residential-rotating/get-settings")
  end

  def fetch_v1_res_rot_countries
    request(:get, "#{ROOT_URL}/v1/residential-rotating/get-countries")
  end

  def fetch_v1_res_rot_states(country_code)
    request(:get, "#{ROOT_URL}/v1/residential-rotating/get-states/#{country_code}")
  end

  def fetch_v1_res_rot_cities(country_code, state_slug)
    request(:get, "#{ROOT_URL}/v1/residential-rotating/get-cities/#{country_code}/#{state_slug}")
  end

  def fetch_v1_res_rot_isp(country_code)
    request(:get, "#{ROOT_URL}/v1/residential-rotating/get-isp/#{country_code}")
  end

  def generate_v1_res_rot_proxy(payload)
    request(:post, "#{ROOT_URL}/v1/residential-rotating/generate-proxy", payload)
  end

  # Place an order on the provider.
  # @param user_id           [Integer] Internal reseller user ID
  # @param product_api_id    [String]  Provider's product identifier
  # @param period            [String]  Duration ("1d","1w","1","3","6","12") or GB for residential
  # @param protocol          [String]  e.g. 'http', 'socks5'
  # @param locations         [String]  Location/city ID (numeric string)
  # @param whitelist_ip      [String]  Client IP for whitelisting (Mobile proxies)
  # @param type              [String]  'global-isp' for Global ISP plans
  # @param target_section_id [Integer] Global ISP targetSectionId
  # @param target_id         [Integer] Global ISP targetId
  # @param resi              [Integer] Set to 1 for Residential Rotating V2
  # @param debug             [String]  Payment method indicator (e.g. 'balance', 'paystack', 'reseller_balance')
  # @return [Hash] API response
  def place_order(user_id:, product_api_id:, period:, protocol: nil, locations: nil,
                  whitelist_ip: nil, type: nil, target_section_id: nil, target_id: nil, resi: nil, debug: nil)
    payload = {
      user_id: user_id.to_i,
      product: product_api_id.to_i,
      period: period.to_s
    }
    payload[:protocol]          = protocol.to_s          if protocol.present?
    payload[:locations]         = locations.to_s         if locations.present?
    payload[:whitelist_ip]      = whitelist_ip.to_s      if whitelist_ip.present?
    payload[:type]              = type.to_s              if type.present?
    payload[:targetSectionId]   = target_section_id.to_i if target_section_id.present?
    payload[:targetId]          = target_id.to_i         if target_id.present?
    payload[:resi]              = resi.to_i              if resi.present?
    payload[:debug]             = debug.to_s             if debug.present?

    request(:post, "#{BASE_URL}/products/place-order", payload)
  end

  # Get price for a potential order.
  # Endpoint: POST /products/get-price
  def get_price(user_id:, product_api_id:, period:, type: nil)
    payload = {
      user_id: user_id.to_i,
      product: product_api_id.to_i,
      period: period.to_s
    }
    payload[:type] = type.to_s if type.present?

    request(:post, "#{BASE_URL}/products/get-price", payload)
  end

  # Fetch full details for an existing order (IP, credentials, etc.).
  # Endpoint: GET /orders/view/{order_id}
  # @return [Hash]
  def view_order(order_id)
    request(:get, "#{BASE_URL}/orders/view/#{order_id}")
  end

  # Fetch VPN order details.
  # Endpoint: GET /orders/vpn/view/{order_id}
  def view_vpn_order(order_id)
    request(:get, "#{BASE_URL}/orders/vpn/view/#{order_id}")
  end

  # Fetch mobile order details.
  # Endpoint: GET /mobile-orders/view/{order_id}
  def view_mobile_order(order_id)
    request(:get, "#{BASE_URL}/mobile-orders/view/#{order_id}")
  end

  # ========== Global ISP Specific ==========

  # Fetch Global ISP configuration/details needed to place an order.
  # Endpoint: GET /ext1/details/isp
  def fetch_global_isp_config
    request(:get, "#{BASE_URL}/ext1/details/isp")
  end

  # Fetch Global ISP orders list.
  # Endpoint: GET /ext1/orders
  def fetch_global_isp_orders
    request(:get, "#{BASE_URL}/ext1/orders")
  end

  # Fetch Global ISP order details.
  # Endpoint: GET /ext1/order-details/{order_id}
  def view_global_isp_order(order_id)
    request(:get, "#{BASE_URL}/ext1/order-details/#{order_id}")
  end

  # Download the OVPN configuration file for a VPN order.
  # Endpoint confirmed from API docs: GET /orders/vpn/download/{order_id}
  # @return [String] Binary OVPN content
  def download_ovpn(order_id)
    uri  = URI("#{BASE_URL}/orders/vpn/download/#{order_id}?download=1")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    req = Net::HTTP::Get.new(uri)
    req['Authorization'] = "Bearer #{fetch_token}"

    response = http.request(req)
    raise "MyProxyApi Download Error: #{response.code} - #{response.body}" unless response.is_a?(Net::HTTPSuccess)

    response.body
  end

  # Update proxy credentials (Static IPs).
  # Endpoint: PATCH /orders/change-credentials
  def update_credentials(order_id, username, password)
    body = { order_id: order_id, username: username, password: password }
    request(:patch, "#{BASE_URL}/orders/change-credentials", body)
  end

  # Update VPN credentials.
  # Endpoint: PATCH /orders/vpn/change-credentials
  def update_vpn_credentials(order_id, username, password)
    body = { order_id: order_id, username: username, password: password }
    request(:patch, "#{BASE_URL}/orders/vpn/change-credentials", body)
  end

  # Rotate/replace the IP address for a static order.
  # Endpoint: PATCH /orders/replacement
  def rotate_ip(order_id, locations: nil)
    body = { order_id: order_id }
    body[:locations] = locations.to_s if locations.present?
    request(:patch, "#{BASE_URL}/orders/replacement", body)
  end

  # Change proxy protocol (HTTP vs SOCKS5) for static IPs.
  # Endpoint: PATCH /orders/change-protocol
  def change_protocol(order_id, protocol)
    body = { order_id: order_id, protocol: protocol }
    request(:patch, "#{BASE_URL}/orders/change-protocol", body)
  end

  # Whitelist an IP address (Static IPs).
  # Endpoint: POST /orders/whitelist-add
  def whitelist_add(order_id, ip, description = nil)
    body = { order_id: order_id, ip: ip }
    body[:description] = description if description.present?
    request(:post, "#{BASE_URL}/orders/whitelist-add", body)
  end

  # Remove an IP from whitelist (Static IPs).
  # Endpoint: DELETE /orders/whitelist-delete
  def whitelist_delete(order_id, ip)
    body = { order_id: order_id, ip: ip }
    request(:delete, "#{BASE_URL}/orders/whitelist-delete", body)
  end

  # ========== Mobile-specific endpoints ==========

  # Update whitelisted IP for a mobile order.
  # Endpoint: PATCH /mobile-orders/update-whitelisted-ip
  def mobile_update_whitelisted_ip(order_id, ip)
    body = { order_id: order_id, ip: ip }
    request(:patch, "#{BASE_URL}/mobile-orders/update-whitelisted-ip", body)
  end

  # Update rotation setting for a mobile order (on/off).
  # Endpoint: PATCH /mobile-orders/update-rotation
  def mobile_update_rotation(order_id, status)
    body = { order_id: order_id, status: status }
    request(:patch, "#{BASE_URL}/mobile-orders/update-rotation", body)
  end

  # Restart a VPN order.
  # Endpoint: GET /orders/vpn/restart/{order_id}
  def restart_vpn(order_id)
    request(:get, "#{BASE_URL}/orders/vpn/restart/#{order_id}")
  end

  # Extend an order.
  # Endpoint: POST /products/place-extend
  def place_extend(user_id:, order_id:, period:)
    payload = {
      user_id: user_id.to_s,
      order_id: order_id.to_s,
      period: period.to_s
    }
    request(:post, "#{BASE_URL}/products/place-extend", payload)
  end

  # ==========================================================================
  # Residential Rotating Configuration Endpoints
  # ==========================================================================

  def fetch_residential_rotating_countries
    # data = request(:get, "#{ROOT_URL}/v2/residential-rotating/get-countries")['data']
    data = request(:get, "#{ROOT_URL}/v1/residential-rotating/get-countries")['data']
    data.is_a?(Hash) ? (data['countries'] || []) : (data || [])
  rescue StandardError => e
    Rails.logger.error("Failed to fetch residential rotating countries: #{e.message}")
    []
  end

  def fetch_residential_rotating_states(country_code)
    # data = request(:get, "#{ROOT_URL}/v2/residential-rotating/get-states/#{country_code}")['data']
    data = request(:get, "#{ROOT_URL}/v1/residential-rotating/get-states/#{country_code}")['data']
    data.is_a?(Hash) ? (data['states'] || []) : (data || [])
  rescue StandardError => e
    Rails.logger.error("Failed to fetch states for #{country_code}: #{e.message}")
    []
  end

  def fetch_residential_rotating_cities(country_code, state_slug)
    # data = request(:get, "#{ROOT_URL}/v2/residential-rotating/get-cities/#{country_code}/#{state_slug}")['data']
    data = request(:get, "#{ROOT_URL}/v1/residential-rotating/get-cities/#{country_code}/#{state_slug}")['data']
    data.is_a?(Hash) ? (data['cities'] || []) : (data || [])
  rescue StandardError => e
    Rails.logger.error("Failed to fetch cities for #{country_code}/#{state_slug}: #{e.message}")
    []
  end

  def fetch_residential_rotating_isps(country_code)
    # data = request(:get, "#{ROOT_URL}/v2/residential-rotating/get-isp/#{country_code}")['data']
    data = request(:get, "#{ROOT_URL}/v1/residential-rotating/get-isp/#{country_code}")['data']
    data.is_a?(Hash) ? (data['isps'] || data['isp'] || []) : (data || [])
  rescue StandardError => e
    Rails.logger.error("Failed to fetch ISPs for #{country_code}: #{e.message}")
    []
  end

  # ==========================================================================
  # Reseller User ID (static from .env)
  # ==========================================================================

  RESELLER_USER_ID = ENV.fetch('MY_PROXY_RESELLER_USER_ID', '').freeze

  # Returns the single reseller user ID configured in .env.
  # All orders are placed under this master reseller account.
  # @return [String] the MyProxyApi reseller user ID
  def reseller_user_id
    raise 'MY_PROXY_RESELLER_USER_ID is not set in .env' if RESELLER_USER_ID.blank?

    RESELLER_USER_ID
  end

  # ---- Deprecated dynamic sub-user creation (kept for reference) -----------
  # The MyProxyApi create-user endpoint is not supported for our products.
  # All orders now use the static RESELLER_USER_ID from .env.
  #
  # def fetch_invoice_countries ...
  # def create_user(actor, ip_address) ...
  # def get_or_create_user(actor, ip_address) ...
  # --------------------------------------------------------------------------

  private

  # The per-category endpoints return:
  #   { "status": 200, "data": { "id": ..., "proxy_plans": [...], "isp": [...] } }
  # OR for /products/all:
  #   { "status": 200, "data": [ { "proxy_plans": [...] }, ... ] }
  # We need to extract the proxy_plans array from the response.
  def extract_proxy_plans(response)
    data = response['data']

    if data.is_a?(Array)
      # /products/all returns an array of categories
      data.flat_map { |category| category['proxy_plans'] || [] }
    elsif data.is_a?(Hash)
      # Single category endpoint returns a hash
      data['proxy_plans'] || []
    else
      []
    end
  end

  # Authenticate and return a JWT token (cached until shortly before expiration).
  def fetch_token
    return @token if @token && @token_expires_at && Time.current < @token_expires_at

    endpoint = "#{ROOT_URL}/v1/getToken"
    uri      = URI(endpoint)
    http     = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    req = Net::HTTP::Post.new(uri)
    req['Content-Type'] = 'application/json'
    req.body = { username: API_USERNAME, secret: API_SECRET }.to_json

    response = http.request(req)
    raise "MyProxyApi Auth Error: #{response.code} - #{response.body}" unless response.is_a?(Net::HTTPSuccess)

    data   = JSON.parse(response.body)
    @token = data.dig('data', 'token') || data['token']
    raise 'MyProxyApi: No token in auth response' if @token.blank?

    # Token lasts 60s, expire cache at 50s just to be safe
    @token_expires_at = Time.current + 50.seconds

    @token
  end

  # Execute an HTTP request with Bearer auth.
  # Supports :get, :post, and :patch.
  def request(method, url, body = nil, redirect_limit: 5)
    raise 'MyProxyApi: Too many redirects' if redirect_limit.zero?

    uri  = URI(url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl      = uri.scheme == 'https'
    http.read_timeout = 30

    req = case method
          when :get    then Net::HTTP::Get.new(uri)
          when :post   then Net::HTTP::Post.new(uri)
          when :patch  then Net::HTTP::Patch.new(uri)
          when :delete then Net::HTTP::Delete.new(uri)
          else raise ArgumentError, "Unsupported HTTP method: #{method}"
          end

    req['Authorization'] = "Bearer #{fetch_token}"
    req['Content-Type']  = 'application/json'
    req['Accept']        = 'application/json'
    req.body = body.to_json if body

    response = http.request(req)

    if response.is_a?(Net::HTTPRedirection)
      new_url = response['location']
      new_url = "#{uri.scheme}://#{uri.host}#{new_url}" if new_url.start_with?('/')
      return request(method, new_url, body, redirect_limit: redirect_limit - 1)
    end

    raise "MyProxyApi Error #{response.code}: #{response.body}" unless response.is_a?(Net::HTTPSuccess)

    JSON.parse(response.body)
  end
end

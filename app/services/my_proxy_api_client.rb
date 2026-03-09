# frozen_string_literal: true

require 'net/http'
require 'json'

# Client for the MyProxyApi reseller API.
# Handles authentication (JWT Bearer token), order placement, credential
# updates, IP rotation, and VPN OVPN download.
class MyProxyApiClient
  BASE_URL     = ENV.fetch('MY_PROXY_API_URL',  '')
  API_USERNAME = ENV.fetch('MY_PROXY_API_USERNAME', '')
  API_SECRET   = ENV.fetch('MY_PROXY_API_SECRET', '')

  # --------------------------------------------------------------------------
  # Fetch product plans by category
  # --------------------------------------------------------------------------

  def fetch_products_datacenter
    request(:get, "#{BASE_URL}/products/datacenter")['data'] || []
  end

  def fetch_products_isp
    request(:get, "#{BASE_URL}/products/isp")['data'] || []
  end

  def fetch_products_static_residential
    request(:get, "#{BASE_URL}/products/static-residential")['data'] || []
  end

  def fetch_products_residential_vpn
    request(:get, "#{BASE_URL}/products/residential-vpn")['data'] || []
  end

  def fetch_products_residential_rotating
    request(:get, "#{BASE_URL}/products/residential-rotating")['data'] || []
  end

  def fetch_products_premium_isp
    request(:get, "#{BASE_URL}/products/premium-isp")['data'] || []
  end

  def fetch_products_mobile
    request(:get, "#{BASE_URL}/products/mobile")['data'] || []
  end

  # Place an order on the provider.
  # @param user_id           [Integer] Internal reseller user ID
  # @param product_api_id    [String]  Provider's product identifier
  # @param period            [Integer] Duration or traffic amount
  # @param protocol          [String]  e.g. 'http', 'socks5'
  # @param locations         [String]  Location identifier
  # @param whitelist_ip      [String]  Client IP for whitelisting (Mobile proxies)
  # @return [Hash] API response
  def place_order(user_id:, product_api_id:, period:, protocol: nil, locations: nil, whitelist_ip: nil)
    payload = {
      user_id: user_id.to_i,
      product: product_api_id.to_i,
      period: period.to_s,
      debug: 'api'
    }
    payload[:protocol]     = protocol.to_s     if protocol.present?
    payload[:locations]    = locations.to_s    if locations.present?
    payload[:whitelist_ip] = whitelist_ip.to_s if whitelist_ip.present?

    request(:post, "#{BASE_URL}/products/place-order", payload)
  end

  # Fetch full details for an existing order (IP, credentials, etc.).
  # Endpoint: GET /orders/view/{order_id}
  # @return [Hash]
  def view_order(order_id)
    request(:get, "#{BASE_URL}/orders/view/#{order_id}")
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

  # Update proxy credentials.
  # Endpoint: PATCH /orders/change-credentials
  # @param order_id  [String] Provider order ID
  # @param username  [String]
  # @param password  [String]
  def update_credentials(order_id, username, password)
    body = { order_id: order_id, username: username, password: password }
    request(:patch, "#{BASE_URL}/orders/change-credentials", body)
  end

  # Rotate the IP address for an order.
  # Endpoint: PATCH /orders/replacement
  # @param order_id [String] Provider order ID
  def rotate_ip(order_id)
    request(:patch, "#{BASE_URL}/orders/replacement", { order_id: order_id })
  end

  private

  # Authenticate and return a JWT token (cached for the lifetime of this object).
  def fetch_token
    return @token if @token

    endpoint = "#{BASE_URL}/getToken"
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

    @token
  end

  # Execute an HTTP request with Bearer auth.
  # Supports :get, :post, and :patch.
  def request(method, url, body = nil)
    uri  = URI(url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl      = true
    http.read_timeout = 30

    req = case method
          when :get   then Net::HTTP::Get.new(uri)
          when :post  then Net::HTTP::Post.new(uri)
          when :patch then Net::HTTP::Patch.new(uri)
          else raise ArgumentError, "Unsupported HTTP method: #{method}"
          end

    req['Authorization'] = "Bearer #{fetch_token}"
    req['Content-Type']  = 'application/json'
    req['Accept']        = 'application/json'
    req.body = body.to_json if body

    response = http.request(req)
    raise "MyProxyApi Error #{response.code}: #{response.body}" unless response.is_a?(Net::HTTPSuccess)

    JSON.parse(response.body)
  end
end

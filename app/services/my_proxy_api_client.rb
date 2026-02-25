# frozen_string_literal: true

require 'net/http'
require 'json'

class MyProxyApiClient
  BASE_URL = ENV.fetch('MY_PROXY_API_URL', 'https://reseller.myproxyapi.com/api/v1')
  API_USERNAME = ENV.fetch('MY_PROXY_API_USERNAME', 'placeholder_username')
  API_SECRET = ENV.fetch('MY_PROXY_API_SECRET', 'placeholder_secret')

  def initialize
    @uri = URI(BASE_URL)
    @token = nil
  end

  def authenticate
    endpoint = "#{BASE_URL}/getToken"
    uri = URI(endpoint)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    req = Net::HTTP::Post.new(uri)
    req['Content-Type'] = 'application/json'
    req.body = { username: API_USERNAME, secret: API_SECRET }.to_json

    response = http.request(req)
    raise "MyProxyApi Auth Error: #{response.code} - #{response.body}" unless response.is_a?(Net::HTTPSuccess)

    data = JSON.parse(response.body)
    @token = data['data']['token'] || data['token'] # Handle potential API payload structures
  end

  # Fetch all active proxies from the provider
  # Returns an array of proxy hashes
  def fetch_proxies
    # endpoint = "#{BASE_URL}/proxies"
    # response = request(:get, endpoint)
    # response['data'] || []

    # MOCK DATA FOR DEVELOPMENT until real API details are integrated
    [
      {
        'id' => 'mp_12345',
        'type' => 'mobile_proxy',
        'ip' => '1.2.3.4',
        'port' => 8080,
        'username' => 'user1',
        'password' => 'pass1',
        'status' => 'active',
        'country' => 'US'
      },
      {
        'id' => 'dc_67890',
        'type' => 'static_datacenter',
        'ip' => '5.6.7.8',
        'port' => 8000,
        'username' => 'user2',
        'password' => 'pass2',
        'status' => 'active',
        'country' => 'DE'
      }
    ]
  end

  # Places an order on the provider using the reseller's deposit
  # For residential rotating, period = traffic amount in GB
  # @param user_id [Integer] Internal user ID for tracking
  # @param product_api_id [String] The API identifier for the product being ordered
  # @param period [Integer, String] Duration or amount based on proxy type
  # @param locations [String, nil] Location identifier for static/mobile proxies
  # @param whitelist_ip [String, nil] Client IP for proxy whitelisting (required for Mobile)
  # @return [Hash] Response payload from API containing order details
  def place_order(user_id:, product_api_id:, period:, protocol: nil, locations: nil, whitelist_ip: nil)
    endpoint = "#{BASE_URL}/products/place-order"
    
    payload = {
      user_id: user_id.to_i,
      product: product_api_id.to_i,
      period: period.to_s
    }

    payload[:protocol] = protocol.to_s if protocol.present?
    payload[:locations] = locations.to_s if locations.present?
    payload[:whitelist_ip] = whitelist_ip.to_s if whitelist_ip.present?
    
    # Request will raise an error if not 2xx success
    response_data = request(:post, endpoint, payload)
    
    # Provider returns order and credential details
    response_data
  end

  private

  def request(method, url, body = nil)
    uri = URI(url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    request = case method
              when :get then Net::HTTP::Get.new(uri)
              when :post then Net::HTTP::Post.new(uri)
              end

    token = authenticate
    request['Authorization'] = "Bearer #{token}"
    request['Content-Type'] = 'application/json'
    request.body = body.to_json if body

    response = http.request(request)

    raise "MyProxyApi Error: #{response.code} - #{response.body}" unless response.is_a?(Net::HTTPSuccess)

    JSON.parse(response.body)
  end
end

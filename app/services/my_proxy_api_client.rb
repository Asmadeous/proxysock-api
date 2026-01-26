require 'net/http'
require 'json'

class MyProxyApiClient
  BASE_URL = ENV.fetch('MY_PROXY_API_URL', 'https://api.myproxyapi.com/v1')
  API_KEY = ENV.fetch('MY_PROXY_API_KEY', 'placeholder_key')

  def initialize
    @uri = URI(BASE_URL)
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

  private

  def request(method, url, body = nil)
    uri = URI(url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    request = case method
              when :get then Net::HTTP::Get.new(uri)
              when :post then Net::HTTP::Post.new(uri)
              end

    request['Authorization'] = "Bearer #{API_KEY}"
    request['Content-Type'] = 'application/json'
    request.body = body.to_json if body

    response = http.request(request)
    
    unless response.is_a?(Net::HTTPSuccess)
      raise "MyProxyApi Error: #{response.code} - #{response.body}"
    end

    JSON.parse(response.body)
  end
end

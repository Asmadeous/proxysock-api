# frozen_string_literal: true

require 'net/http'
require 'openssl'
require 'json'

# Client for the eSIM Access (Redtea Mobile) Open API.
# Docs: https://doc.esimaccess.com/
# Authentication: every request sends RT-AccessCode header AND an HMAC-SHA256
# signature of the JSON body keyed with the RT-SecretKey.
class EsimAccessService
  BASE_URL = 'https://api.esimaccess.com/api/v1/open'

  def initialize
    @access_code = ENV.fetch('ESIM_ACCESS_API_KEY', '')
    @secret_key  = ENV.fetch('ESIM_ACCESS_SECRET_KEY', '')
  end

  # Place an order for eSIM profiles.
  # Endpoint: POST /order/profiles
  # Required body fields: transactionId, packageInfoList[{ packageCode, count, price }]
  def order_esim(package_code, count = 1, price = 0)
    transaction_id = SecureRandom.hex(16) # Unique reference per call
    body = {
      transactionId: transaction_id,
      packageInfoList: [
        { packageCode: package_code, count: count, price: price }
      ]
    }
    response = request(:post, '/esim/order', body)

    return response['obj'].merge('transactionId' => transaction_id) if response['success'] == true

    raise "eSIM Access Order Failed: #{response['errorMessage']} (code: #{response['errorCode']})"
  end

  # Query eSIM details by ICCID.
  # Endpoint: POST /esim/query
  def fetch_esim_details(iccid)
    response = request(:post, '/esim/query', {
                         iccid: iccid,
                         pager: { pageNum: 1, pageSize: 50 }
                       })
    response['obj']
  end

  # Fetch all allocated eSIM profiles for a given orderNo.
  # Returns an array of profile hashes with iccid, ac, qrCodeUrl, etc.
  # Endpoint: POST /esim/query
  def fetch_profiles_by_order(order_no)
    response = request(:post, '/esim/query', {
                         orderNo: order_no,
                         pager: { pageNum: 1, pageSize: 50 }
                       })

    return [] unless response['success'] == true

    response.dig('obj', 'esimList') || []
  end

  # Check data usage for up to 10 eSIMs by their transaction numbers.
  # Endpoint: POST /esim/usage/query
  def fetch_usage_batch(transaction_nos)
    response = request(:post, '/esim/usage/query', { esimTranNoList: Array(transaction_nos) })
    return response['obj'] if response['success'] == true

    []
  end

  # List available packages / products.
  # Endpoint: POST /package/list
  def list_packages(params = { type: 'BASE' })
    response = request(:post, '/package/list', params)
    return response.dig('obj', 'packageList') if response['success'] == true

    []
  end

  # Top-up / renew an active eSIM.
  # Endpoint: POST /esim/topup
  def top_up(iccid:, package_code:, count: 1)
    transaction_id = SecureRandom.hex(16)
    body = {
      transactionId: transaction_id,
      iccid: iccid,
      packageCode: package_code,
      count: count
    }
    response = request(:post, '/esim/topup', body)

    return response['obj'] if response['success'] == true

    raise "eSIM Access Top-up Failed: #{response['errorMessage']}"
  end

  private

  # Build and sign an HTTP request with HMAC-SHA256.
  # signData = Timestamp + RequestID + AccessCode + RequestBody
  # signature = HMACSHA256(signData, SecretCode)
  def request(method, endpoint, body = {})
    uri  = URI("#{BASE_URL}#{endpoint}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.read_timeout = 30

    timestamp  = Time.now.to_i.to_s
    request_id = SecureRandom.uuid
    body_json  = body.to_json

    # Calculate signature as per docs
    sign_data = "#{timestamp}#{request_id}#{@access_code}#{body_json}"
    signature = OpenSSL::HMAC.hexdigest('SHA256', @secret_key, sign_data)

    req = case method
          when :get  then Net::HTTP::Get.new(uri)
          when :post then Net::HTTP::Post.new(uri)
          else raise ArgumentError, "Unsupported HTTP method: #{method}"
          end

    req['RT-AccessCode'] = @access_code
    req['RT-RequestID']  = request_id
    req['RT-Timestamp']  = timestamp
    req['RT-Signature']  = signature
    req['Content-Type']  = 'application/json'
    req['Accept']        = 'application/json'
    req.body = body_json

    response = http.request(req)

    raise "eSIM Access HTTP Error #{response.code}: #{response.body}" unless response.is_a?(Net::HTTPSuccess)

    JSON.parse(response.body)
  end
end

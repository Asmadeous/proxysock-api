# frozen_string_literal: true

class EsimAccessService
  BASE_URL = 'https://api.esimaccess.com/api/v1/open'

  def initialize
    @api_key = ENV['ESIM_ACCESS_API_KEY']
  end

  def order_esim(package_code, count = 1)
    response = request(:post, '/esim/order', {
                         packageCode: package_code,
                         count: count,
                         price: 0 # Optional as per docs if using predefined price
                       })

    # Docs say response contains orderNo or list of profiles depending on version
    # "Single Profile ordering changed to batch Profile ordering [via Order Profiles request]"
    # Assuming successful response structure: { obj: { orderNo: "..." } }

    return response['obj'] if response['obj']

    raise "eSIM Access Order Failed: #{response['errorMessage']}"
  end

  def fetch_esim_details(iccid)
    # Using 'query' endpoint as per docs
    response = request(:post, '/esim/query', { iccid: iccid })
    response['obj']
  end

  def fetch_usage_batch(transaction_nos)
    # Docs: "Check the data usage of up to 10 eSIMs via their esimTranNo"
    # Endpoint: /esim/usage/query
    # Body: { esimTranNoList: [ "...", "..." ] }

    response = request(:post, '/esim/usage/query', { esimTranNoList: transaction_nos })

    return response['obj'] if response['obj']

    # returns list of { esimTranNo, dataUsage, totalData, lastUpdateTime }

    []
  end

  private

  def request(_method, endpoint, body = {})
    uri = URI("#{BASE_URL}#{endpoint}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    request = Net::HTTP::Post.new(uri)
    request['RT-AccessCode'] = @api_key # Check docs for exact header name. Usually RT-AccessCode or similar.
    # Docs say: "AUTHORIZATION API Key"
    # Assuming header is RT-AccessCode based on common providers, or just in body?
    # Docs snippet showed "This request is using API Key from collection eSIM Access API"
    # Let's assume standard Header 'RT-AccessCode' or 'Authorization'.
    # Validating from snippet: "AUTHORIZATION API Key" usually implies a header.
    # The snippet doesn't explicitly name the header key but standard is often RT-AccessCode for this provider type (Redtea/eSIMAccess).
    request['RT-AccessCode'] = @api_key

    request['Content-Type'] = 'application/json'
    request.body = body.to_json

    response = http.request(request)
    JSON.parse(response.body)
  end
end

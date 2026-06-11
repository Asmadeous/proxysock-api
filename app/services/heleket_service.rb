# frozen_string_literal: true

require 'digest'
require 'base64'

class HeleketService
  BASE_URL = 'https://api.heleket.com'

  def initialize
    @merchant_id = ENV['HELEKET_MERCHANT_ID']
    @payment_api_key = ENV['HELEKET_PAYMENT_API_KEY'] || ENV['HELEKET_API_KEY']
    @payout_api_key = ENV['HELEKET_PAYOUT_API_KEY']
  end

  def create_invoice(amount:, currency:, order_number:, callback_url:, email: nil)
    body = {
      amount: amount.to_s,
      currency: currency || 'USD',
      order_id: order_number,
      url_callback: callback_url
    }

    body[:customer_email] = email if email.present?

    response = request('/v1/payment', body, @payment_api_key)

    # Heleket returns an object containing the URL inside the 'result' key
    {
      url: response['paymentUrl'] || response['url'] || response.dig('data', 'url') || response.dig('result', 'url'),
      txn_id: response['uuid'] || response['id'] || response.dig('data', 'uuid') || response.dig('data', 'id') || response.dig('result', 'uuid') || response.dig('result', 'id')
    }
  rescue StandardError => e
    Rails.logger.error("Heleket Create Invoice Error: #{e.message}")
    raise e
  end

  def verify_transaction(invoice_id)
    response = request('/v1/payment/info', { uuid: invoice_id }, @payment_api_key)

    status = response['status'] || response.dig('data', 'status') || response.dig('result', 'status')

    if %w[PAID COMPLETED SUCCESS].include?(status.to_s.upcase)
      { status: 'success', amount: response['amount'] || response.dig('data', 'amount') || response.dig('result', 'amount'), currency: response['currency'] || response.dig('data', 'currency') || response.dig('result', 'currency') }
    else
      { status: 'pending', internal_status: status }
    end
  rescue StandardError => e
    Rails.logger.error("Heleket verification failed: #{e.message}")
    { status: 'error', message: e.message }
  end

  # Create a withdrawal request.
  def create_withdrawal(amount, currency, address)
    request('/v1/payout', {
              amount: amount.to_s,
              currency: currency,
              address: address
            }, @payout_api_key)
  end

  private

  def request(endpoint, body, api_key)
    uri = URI("#{BASE_URL}#{endpoint}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.verify_mode = OpenSSL::SSL::VERIFY_PEER

    # All Heleket API calls must be POST
    req = Net::HTTP::Post.new(uri)
    req['merchant'] = @merchant_id

    body_json = body.present? ? body.to_json : ''

    # Sign: md5(base64_encode(data_json) . API_KEY)
    encoded_body = Base64.strict_encode64(body_json)
    req['sign'] = Digest::MD5.hexdigest("#{encoded_body}#{api_key}")

    req['Content-Type'] = 'application/json'
    req.body = body_json

    response = http.request(req)

    # Debug logging
    Rails.logger.info("Heleket API Request: POST #{uri}")
    Rails.logger.info("Heleket API Response Code: #{response.code}")

    begin
      JSON.parse(response.body)
    rescue JSON::ParserError => e
      Rails.logger.error("Heleket JSON Parse Error: #{e.message}")
      { 'error' => 'Invalid JSON', 'body' => response.body.to_s[0..200] }
    end
  end
end

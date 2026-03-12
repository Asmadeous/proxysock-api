# frozen_string_literal: true

class HundredpayService
  BASE_URL = 'https://api.100pay.co/api/v1'

  def initialize
    @api_key = ENV['HUNDREDPAY_API_KEY']
    @secret_key = ENV['HUNDREDPAY_SECRET_KEY']
    @user_id = ENV['HUNDREDPAY_USER_ID']
  end

  # Create a payment charge (supports both card and crypto via hosted checkout).
  # Returns { url: hosted_payment_url, txn_id: charge_id }
  def create_invoice(amount:, currency:, order_number:, callback_url:, email: nil, description: nil)
    response = request(:post, '/pay/charge', {
                         ref_id: order_number,
                         customer: {
                           user_id: order_number,
                           name: email || 'Customer',
                           email: email || '',
                           phone: ''
                         },
                         billing: {
                           amount: amount.to_s,
                           currency: currency || 'USD',
                           country: 'US',
                           description: description || "Payment #{order_number}",
                           pricing_type: 'fixed_price'
                         },
                         metadata: {
                           order_id: order_number,
                           charge_ref: order_number
                         },
                         call_back_url: callback_url,
                         userId: @user_id,
                         charge_source: 'api'
                       })

    {
      url: response['hosted_url'],
      txn_id: response['chargeId'] || response['_id']
    }
  end

  # Verify a payment by charge ID.
  # Returns { status: 'success'|'pending'|'error', amount:, currency: }
  def verify_transaction(charge_id)
    response = request(:post, "/pay/crypto/payment/#{charge_id}", {})

    status_value = response.dig('data', 'charge', 'status', 'value') ||
                   response.dig('data', 'status') ||
                   response.dig('status', 'value')

    if %w[paid overpaid].include?(status_value)
      paid_amount = response.dig('data', 'charge', 'status', 'total_paid') ||
                    response.dig('data', 'charge', 'billing', 'amount')
      {
        status: 'success',
        amount: paid_amount.to_f,
        currency: response.dig('data', 'charge', 'billing', 'currency') || 'USD'
      }
    else
      { status: 'pending', internal_status: status_value }
    end
  rescue StandardError => e
    Rails.logger.error("100Pay verification failed: #{e.message}")
    { status: 'error', message: e.message }
  end

  # Get charge details by charge ID.
  def get_charge(charge_id)
    request(:get, "/pay/charge/#{charge_id}")
  end

  private

  def request(method, endpoint, body = {})
    uri = URI("#{BASE_URL}#{endpoint}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.verify_mode = OpenSSL::SSL::VERIFY_PEER

    req = case method
          when :get then Net::HTTP::Get.new(uri)
          when :post then Net::HTTP::Post.new(uri)
          end

    req['api-key'] = @api_key
    req['Content-Type'] = 'application/json'
    req.body = body.to_json if method == :post && body.present?

    response = http.request(req)

    Rails.logger.info("100Pay API Request: #{method.to_s.upcase} #{uri}")
    Rails.logger.info("100Pay API Response Code: #{response.code}")

    begin
      JSON.parse(response.body)
    rescue JSON::ParserError => e
      Rails.logger.error("100Pay JSON Parse Error: #{e.message}")
      { 'error' => 'Invalid JSON', 'body' => response.body.to_s[0..200] }
    end
  end
end

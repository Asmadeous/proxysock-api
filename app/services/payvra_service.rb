# frozen_string_literal: true

class PayvraService
  BASE_URL = 'https://api.payvra.com' # Corrected API URL

  def initialize
    @api_key = ENV['PAYVRA_API_KEY']
  end

  def create_charge(amount, currency)
    response = request(:post, '/charges', {
                         amount: amount,
                         currency: currency,
                         redirect_url: "#{ENV['APP_URL']}/deposits/complete",
                         webhook_url: "#{ENV['APP_URL']}/webhooks/payvra/callback"
                       })

    response['payment_url']
  end

  def create_payment(amount:, currency:, reference:, callback_url:)
    response = request(:post, '/merchants/invoice/create', {
                         amount: amount,
                         amountCurrency: currency,
                         returnUrl: callback_url,
                         acceptedCoins: %w[BTC ETH USDC USDT]
                       })

    { payment_url: response['paymentUrl'] || response['url'], invoice_id: response['id'] }
  end

  def verify_transaction(invoice_id)
    # Docs suggest GET for order status: https://docs.payvra.com/merchant/order/details
    # Path is likely /merchant/order/details or similar
    response = request(:get, "/merchant/order/details?id=#{invoice_id}")

    if response['status'] == 'COMPLETED'
      { status: 'success', amount: response['amount'], currency: response['amountCurrency'] }
    else
      { status: 'pending', internal_status: response['status'] }
    end
  rescue StandardError => e
    Rails.logger.error("Payvra verification failed: #{e.message}")
    { status: 'error', message: e.message }
  end

  # Create a withdrawal request.
  def create_withdrawal(amount, currency, address)
    request(:post, '/merchants/withdrawal/create', {
              amount: amount,
              currency: currency,
              address: address
            })
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

    req['Authorization'] = "Bearer #{@api_key}"
    req['Content-Type'] = 'application/json'
    req.body = body.to_json if method == :post && body.present?

    response = http.request(req)

    # Debug logging
    Rails.logger.info("Payvra API Request: #{method.to_s.upcase} #{uri}")
    Rails.logger.info("Payvra API Response Code: #{response.code}")

    begin
      JSON.parse(response.body)
    rescue JSON::ParserError => e
      Rails.logger.error("Payvra JSON Parse Error: #{e.message}")
      { 'error' => 'Invalid JSON', 'body' => response.body.to_s[0..200] }
    end
  end
end

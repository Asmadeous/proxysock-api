# frozen_string_literal: true

class PayvraService
  BASE_URL = 'https://payvra.com/api/v1' # Assuming base URL from mock context

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
                         # Note: Payvra requires tracking its own return reference if applicable via sessions
                       })

    { payment_url: response['paymentUrl'] || response['url'] }
  end

  private

  def request(_method, endpoint, body = {})
    uri = URI("#{BASE_URL}#{endpoint}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.verify_mode = OpenSSL::SSL::VERIFY_NONE # Bypass SSL for self-signed Payvra certs

    request = Net::HTTP::Post.new(uri)
    request['Authorization'] = "Bearer #{@api_key}"
    request['Content-Type'] = 'application/json'
    request.body = body.to_json

    response = http.request(request)
    JSON.parse(response.body)
  end
end

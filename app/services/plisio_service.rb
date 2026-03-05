# frozen_string_literal: true

class PlisioService
  BASE_URL = 'https://plisio.net/api/v1'

  def initialize
    @secret_key = ENV['PLISIO_SECRET_KEY']
  end

  def create_invoice(amount:, currency:, order_number:, callback_url:, email: nil)
    # Convert local currency to crypto or use Plisio's fiat conversion
    response = request(:get, '/invoices/new', {
                         source_currency: currency || 'USD',
                         source_amount: amount,
                         order_number: order_number,
                         order_name: "Order #{order_number}",
                         callback_url: callback_url,
                         email: email || 'customer@example.com'
                       })

    if response['status'] == 'success'
      return {
        invoice_url: response['data']['invoice_url'],
        txn_id: response['data']['txn_id']
      }
    end

    raise "Plisio Error: #{response['data']['message']}"
  end

  def verify_transaction(order_number)
    response = request(:get, '/operations', {
                         order_number: order_number
                       })

    if response['status'] == 'success' && response['data'].is_a?(Array)
      op = response['data'].find { |t| t['order_number'] == order_number }
      if op && %w[completed mismatch].include?(op['status'])
        return {
          status: 'success',
          amount: op['amount'],
          currency: op['currency']
        }
      end
    end

    { status: 'pending' }
  rescue StandardError => e
    Rails.logger.error("Plisio verification failed: #{e.message}")
    { status: 'error', message: e.message }
  end

  # Request a withdrawal to a crypto address.
  def withdraw(amount, currency, address, order_number)
    request(:get, '/withdraw', {
      currency: currency,
      amount: amount,
      address: address,
      order_number: order_number
    })
  end

  def verify_callback(params)
  end

  private

  def request(_method, endpoint, params = {})
    params[:api_key] = @secret_key
    uri = URI("#{BASE_URL}#{endpoint}")
    uri.query = URI.encode_www_form(params)

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    request = Net::HTTP::Get.new(uri) # Plisio uses GET for everything mostly? Check docs. Typically GET for invoice creation.

    response = http.request(request)
    JSON.parse(response.body)
  end
end

# frozen_string_literal: true

class PlisioService
  BASE_URL = 'https://plisio.net/api/v1'

  def initialize
    @secret_key = ENV['PLISIO_SECRET_KEY']
  end

  def create_invoice(amount:, currency:, order_number:, callback_url:, email: nil)
    # Plisio uses GET for everything by default, which is unusual for invoice creation but documented.
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
        url: response['data']['invoice_url'],
        txn_id: response['data']['txn_id']
      }
    end

    raise "Plisio Error: #{response['data'].is_a?(Hash) ? response['data']['message'] : response['data']}"
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
          amount: op['source_amount'], # Use fiat amount for wallet credit
          currency: op['source_currency']
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

  def verify_callback(params); end

  private

  def request(method, endpoint, params = {})
    params[:api_key] = @secret_key
    uri = URI("#{BASE_URL}#{endpoint}")

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    if method == :get
      uri.query = URI.encode_www_form(params)
      request_obj = Net::HTTP::Get.new(uri)
    elsif method == :post
      request_obj = Net::HTTP::Post.new(uri)
      request_obj['Content-Type'] = 'application/x-www-form-urlencoded'
      request_obj.set_form_data(params)
    else
      raise ArgumentError, "Unsupported method: #{method}"
    end

    response = http.request(request_obj)
    JSON.parse(response.body)
  end
end

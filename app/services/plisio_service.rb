# frozen_string_literal: true

class PlisioService
  BASE_URL = 'https://api.plisio.net/api/v1'

  def initialize
    @secret_key = ENV['PLISIO_SECRET_KEY']
  end

  def create_invoice(amount:, currency:, order_number:, callback_url: nil, success_url: nil, email: nil, **_extra)
    # Plisio's `callback_url` is the server-to-server IPN endpoint (NOT the user redirect).
    # It MUST point at our backend webhook, and non-PHP integrations MUST add `json=true`
    # so the callback arrives as JSON we can verify (Plisio docs).
    #
    # Any URL a caller passes via `callback_url`/`success_url` is the page the *user* should
    # land on after paying, so we wire it to Plisio's invoice success/fail buttons instead.
    redirect_url = success_url || callback_url

    params = {
      source_currency: currency || 'USD',
      source_amount: amount,
      order_number: order_number,
      order_name: "Order #{order_number}",
      callback_url: ipn_callback_url,
      email: email || 'customer@example.com'
    }
    if redirect_url.present?
      params[:success_invoice_url] = redirect_url
      params[:fail_invoice_url] = redirect_url
    end

    # Plisio uses GET for everything by default, which is unusual for invoice creation but documented.
    response = request(:get, '/invoices/new', params)

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

    operations = response.dig('data', 'operations')
    if response['status'] == 'success' && operations.is_a?(Array)
      op = operations.find { |t| t['order_number'].to_s == order_number.to_s }
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
  def withdraw(amount, currency, address, order_number = nil)
    request(:get, '/operations/withdraw', {
              currency: currency,
              type: 'cash_out',
              amount: amount,
              to: address,
              order_number: order_number
            }.compact)
  end

  def balances(currency)
    request(:get, "/balances/#{currency}")
  end

  private

  # Backend IPN endpoint Plisio POSTs invoice status updates to.
  # `json=true` is required so the callback is delivered as JSON (Plisio docs, non-PHP).
  def ipn_callback_url
    base = ENV['APP_URL'].to_s.gsub(%r{/$}, '')
    "#{base}/webhooks/plisio?json=true"
  end

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

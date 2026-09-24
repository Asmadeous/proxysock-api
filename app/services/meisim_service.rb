# frozen_string_literal: true

# Client for the MeiSIM USA dealer API.
# Docs: https://www.meisimusa.com/api-docs.html
# Authentication: the dealer key is sent as the x-dealer-key header.
class MeisimService
  BASE_URL = 'https://api.meisimusa.com'
  TIMEOUT = 30

  class Error < StandardError
    attr_reader :status

    def initialize(message, status: nil)
      super(message)
      @status = status
    end

    # No HTTP status (timeout, connection drop) or a 5xx: MeiSIM may or may not
    # have acted on the request, and there is no idempotency key to retry with.
    def ambiguous?
      status.nil? || status >= 500
    end
  end

  def initialize(api_key: ENV.fetch('MEISIM_DEALER_KEY', ''))
    @api_key = api_key
  end

  # Full public catalogue (travel data plans and US prepaid lines).
  def products
    request(:get, '/mm/products').fetch('products', [])
  end

  # Dealer wallet balance, markup, and recent transactions.
  def wallet
    request(:get, '/dealer/wallet')
  end

  # Wallet-funded order. Returns orderId, shortId, unitPriceUsd, totalUsd, and
  # activation ("delivered", "pending", or "failed" with a failure object).
  def create_order(product_id:, customer_email:, customer_name:, quantity: 1, **extra)
    body = { productId: product_id, customerEmail: customer_email, customerName: customer_name,
             quantity: quantity }.merge(extra.compact)
    request(:post, '/dealer/order', body)
  end

  # Order state and per-line activation details (ICCID, LPA, QR URL, phone number).
  def order(order_id)
    request(:get, "/dealer/order/#{ERB::Util.url_encode(order_id)}")
  end

  # Travel data usage for one line. US and UK carrier lines answer 409 NO_USAGE_API.
  def usage(order_id, line: 1)
    request(:get, "/dealer/order/#{ERB::Util.url_encode(order_id)}/usage?line=#{line.to_i}")
  end

  private

  def request(method, path, payload = nil)
    options = { headers: headers, timeout: TIMEOUT }
    options[:body] = payload.to_json if payload
    response = HTTParty.public_send(method, "#{BASE_URL}#{path}", **options)
    body = response.parsed_response

    unless response.success? && body.is_a?(Hash) && body['ok'] != false
      raise Error.new("MeiSIM #{method.upcase} #{path} failed: #{error_message(body)}", status: response.code)
    end

    body
  rescue Net::OpenTimeout, Net::ReadTimeout, SocketError, Errno::ECONNREFUSED, Errno::ECONNRESET => e
    raise Error, "MeiSIM #{method.upcase} #{path} failed: #{e.class}"
  end

  def headers
    { 'x-dealer-key' => @api_key, 'Accept' => 'application/json', 'Content-Type' => 'application/json' }
  end

  def error_message(body)
    return body.to_s[0, 200] unless body.is_a?(Hash)

    [body['error'], body['message']].compact.join(': ').presence || 'unexpected response'
  end
end

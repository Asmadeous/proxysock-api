# frozen_string_literal: true

# Client for the MeiSIM USA dealer API.
# Docs: https://www.meisimusa.com/api-docs.html
# Authentication: the dealer key is sent as the x-dealer-key header.
class MeisimService
  BASE_URL = 'https://api.meisimusa.com'
  TIMEOUT = 120 # seconds; US carrier orders can take well over a minute to answer

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

  # Stripe fee for topping up our MeiSIM wallet by `net` USD: { net, gross, fee }.
  def topup_preview(net)
    request(:get, "/dealer/topup/preview?net=#{net.to_d}")
  end

  # Stripe checkout for a MeiSIM wallet top-up ($50-$10,000): { checkoutUrl, netAmt, grossAmt, fee }.
  def topup(amount_usd)
    request(:post, '/dealer/topup', { amountUsd: amount_usd.to_d.to_f })
  end

  # Wallet statement as CSV (Date, Type, Amount USD, Balance after USD, Description, Order ID,
  # Stripe session). MeiSIM defaults to the last 90 days.
  def statement(from: nil, to: nil)
    query = { from: from, to: to }.compact.to_query
    path = "/dealer/statement#{"?#{query}" if query.present?}"
    response = HTTParty.get("#{BASE_URL}#{path}", headers: headers.merge('Accept' => 'text/csv'), timeout: TIMEOUT)
    raise Error.new("MeiSIM GET #{path} failed: #{error_message(response.parsed_response)}", status: response.code) unless response.success?

    response.body
  rescue Net::OpenTimeout, Net::ReadTimeout, SocketError, Errno::ECONNREFUSED, Errno::ECONNRESET => e
    raise Error, "MeiSIM GET statement failed: #{e.class}"
  end

  # eSIM Verify: classifies activation codes as available, used, invalid, error or unknown
  # without consuming them. $1 per code from our MeiSIM wallet; rows that error are
  # refunded. Returns { batch_id, total_rows, charged_usd, wallet_balance_usd }.
  def esim_verify(lpas)
    request(:post, '/dealer/esim-verify', { lpas: Array(lpas) })
  end

  # Progress of a verify batch: { batch: {...}, progress: { pending, in_progress, used,
  # available, invalid, error_count, unknown, total } }.
  def esim_verify_batch(batch_id)
    request(:get, "/dealer/esim-verify/#{ERB::Util.url_encode(batch_id)}")
  end

  # PNG bytes of a line's install QR (GET /dealer/order/:orderId/qr). The only QR for
  # carrier-held profiles (Moxee, LinkUp), which come with no activation code. MeiSIM
  # answers 409 when there is no QR, 410 for cancelled orders, 404 for an unknown line.
  def qr_png(order_id, line: 1, size: 480)
    path = "/dealer/order/#{ERB::Util.url_encode(order_id)}/qr?line=#{line.to_i}&size=#{size.to_i}"
    response = HTTParty.get("#{BASE_URL}#{path}", headers: headers.merge('Accept' => 'image/png'), timeout: TIMEOUT)
    unless response.success? && response.headers['content-type'].to_s.start_with?('image/')
      raise Error.new("MeiSIM GET #{path} failed: #{error_message(response.parsed_response)}", status: response.code)
    end

    response.body
  rescue Net::OpenTimeout, Net::ReadTimeout, SocketError, Errno::ECONNREFUSED, Errno::ECONNRESET => e
    raise Error, "MeiSIM GET QR failed: #{e.class}"
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

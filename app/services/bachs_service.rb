# frozen_string_literal: true

# Client for the Bachs payments API. Docs: https://docs.bachs.io
# The key prefix decides the environment: sk_live_ keys go to production, anything
# else to the sandbox. Amounts are USD decimal strings ("12.50"), never minor units.
class BachsService
  LIVE_URL = 'https://api.bachs.io'
  SANDBOX_URL = 'https://sandbox-api.bachs.io'
  TIMEOUT = 30
  SIGNATURE_TOLERANCE = 300 # seconds

  class Error < StandardError
    attr_reader :status, :error_code

    def initialize(message, status: nil, error_code: nil)
      super(message)
      @status = status
      @error_code = error_code
    end
  end

  # The amount is over the account's per-payment limit for every payment method, so
  # Bachs refuses the checkout. The message is written for the customer.
  class LimitExceeded < Error; end

  def initialize(api_key: ENV.fetch('BACHS_API_KEY', ''))
    @api_key = api_key
  end

  # What a paid checkout's payment still owes, in the payment's currency. Above zero
  # when Bachs accepted a short payment as final and completed the checkout anyway.
  def self.amount_owed(checkout)
    charge = checkout['charge'] || {}
    [charge['amount_remaining'].to_d, charge['amount'].to_d - charge['amount_paid'].to_d].max
  end

  # True when `header` (X-Bachs-Signature-V2: "t=<unix>,v1=<hex>[,v1=<hex>]") is an
  # HMAC-SHA256 of "<t>.<raw body>" made with `secret` within the last five minutes.
  # During a secret rotation Bachs sends one v1 per valid secret, so any match passes.
  def self.valid_signature?(raw_body, header, secret, now: Time.current.to_i)
    return false if header.blank? || secret.blank?

    parts = header.split(',').map { |part| part.strip.split('=', 2) }
    timestamp = parts.find { |key, _| key == 't' }&.last.to_i
    return false if timestamp.zero? || (now - timestamp).abs > SIGNATURE_TOLERANCE

    expected = OpenSSL::HMAC.hexdigest('SHA256', secret, "#{timestamp}.#{raw_body}")
    parts.any? { |key, value| key == 'v1' && Rack::Utils.secure_compare(value.to_s, expected) }
  end

  # Hosted checkout for a USD amount priced by ProxySock (no Bachs catalogue). Returns
  # the same { url:, amount:, currency: } shape the other gateway links use, plus the
  # checkout id. `reference` is our DEP/CHECKOUT/ORD reference; Bachs keeps it unique.
  def payment_link(amount:, reference:, email:, success_url: nil)
    body = {
      pricing: { currency: 'USD', amount: money(amount) },
      customer: { email: email },
      reference: reference,
      success_url: public_url(success_url)
    }.compact
    checkout = request(:post, '/v1/checkout-sessions', body, idempotency_key: "checkout-#{reference}")

    { url: checkout['checkout_url'], amount: amount, currency: 'USD', checkout_id: checkout['checkout_id'] }
  end

  def checkout(checkout_id)
    request(:get, "/v1/checkout-sessions/#{ERB::Util.url_encode(checkout_id)}")
  end

  # Bachs allows one refund per payment; `amount` nil refunds what is left of it.
  def create_refund(charge_id:, reference:, amount: nil, reason: nil)
    body = { charge_id: charge_id, reference: reference, amount: amount && money(amount), reason: reason }.compact
    request(:post, '/v1/refunds', body, idempotency_key: "refund-#{reference}")
  end

  private

  def request(method, path, payload = nil, idempotency_key: nil)
    options = { headers: headers(idempotency_key), timeout: TIMEOUT }
    options[:body] = payload.to_json if payload
    response = HTTParty.public_send(method, "#{base_url}#{path}", **options)
    Rails.logger.info("[Bachs] #{method.upcase} #{path} -> #{response.code} (#{response.headers['x-request-id']})")
    body = response.parsed_response
    return body if response.success? && body.is_a?(Hash)

    error_code = body['error_code'] if body.is_a?(Hash)
    raise limit_exceeded(body, response.code) if error_code == 'DEPOSIT_LIMIT_EXCEEDED'

    raise Error.new("Bachs #{method.upcase} #{path} failed: #{error_message(body)}",
                    status: response.code, error_code: error_code)
  rescue Net::OpenTimeout, Net::ReadTimeout, SocketError, Errno::ECONNREFUSED, Errno::ECONNRESET => e
    raise Error, "Bachs #{method.upcase} #{path} failed: #{e.class}"
  end

  def base_url
    @api_key.start_with?('sk_live_') ? LIVE_URL : SANDBOX_URL
  end

  def headers(idempotency_key)
    {
      'Authorization' => "Bearer #{@api_key}",
      'Accept' => 'application/json',
      'Content-Type' => 'application/json',
      'Idempotency-Key' => idempotency_key
    }.compact
  end

  def money(amount)
    format('%.2f', amount.to_d.round(2))
  end

  # Bachs refuses localhost and private-network redirect URLs, even in the sandbox,
  # so local development checkouts go without one.
  def public_url(url)
    host = URI.parse(url.to_s).host
    return if host.blank? || host == 'localhost' || host.end_with?('.localhost')

    ip = IPAddr.new(host)
    url unless ip.private? || ip.loopback?
  rescue IPAddr::InvalidAddressError
    url
  rescue URI::InvalidURIError
    nil
  end

  # The limit is set per account by Bachs, so it is read from the error, never assumed.
  def limit_exceeded(body, status)
    max = body.dig('details', 'max_allowed_amount')
    limit = max ? " of #{max} #{body.dig('details', 'currency') || 'USD'}" : ''
    LimitExceeded.new("This amount is over the Bachs limit#{limit} per payment. " \
                      'Pay a smaller amount or choose another payment method.',
                      status: status, error_code: 'DEPOSIT_LIMIT_EXCEEDED')
  end

  def error_message(body)
    return body.to_s[0, 200] unless body.is_a?(Hash)

    [body['error_code'], body['detail']].compact.join(': ').presence || 'unexpected response'
  end
end

# frozen_string_literal: true

# Client for RexPay (Global Accelerex) — card payments via hosted redirect checkout.
# Docs: https://rexpay-docs.globalaccelerex.com/docs
#
# Auth is HTTP Basic: account email as username, secret key as password.
# Amounts are in MAJOR units (naira, not kobo).
# RexPay exposes no refund, transfer or token-recharge API; those flows are manual.
class RexpayService
  BASE_URL = ENV.fetch('REXPAY_BASE_URL', 'https://pgs-sandbox.globalaccelerex.com')

  SUCCESS_CODE = '00'

  def initialize
    @username = ENV['REXPAY_USERNAME']
    @secret_key = ENV['REXPAY_SECRET_KEY']
  end

  # Builds the callbackUrl passed to createPayment. RexPay redirects the payer
  # here on completion; we carry our own reference and the frontend success page
  # in the query string so the webhook can verify then bounce the user onward.
  def self.webhook_callback_url(reference, redirect_to = nil)
    url = "#{ENV['APP_URL']}/webhooks/rexpay?reference=#{CGI.escape(reference.to_s)}"
    url += "&redirect_to=#{CGI.escape(redirect_to)}" if redirect_to.present?
    url
  end

  # Creates a hosted payment and returns the checkout redirect URL.
  def create_payment(params)
    # RexPay validates userId as an alphanumeric-only "Customer Reference", so
    # strip the email's `@`/`.`; it is for RexPay's records only and is never
    # read back (the webhook reconciles on `reference`).
    user_id = params[:email].to_s.gsub(/[^a-zA-Z0-9]/, '').presence || "cust#{SecureRandom.hex(4)}"

    # Send a clean numeric string like RexPay's docs example ("51"): a whole
    # amount has no decimal point, matching their expected format.
    amt = params[:amount].to_f
    amount_str = (amt % 1).zero? ? amt.to_i.to_s : format('%.2f', amt)

    response = request(:post, '/api/pgs/payment/v2/createPayment', {
                         reference: params[:reference],
                         userId: user_id,
                         amount: amount_str,
                         currency: params[:currency] || 'NGN',
                         callbackUrl: params[:callback_url]
                       })

    if response['paymentUrl'].blank?
      raise "RexPay Payment Creation Failed: #{response['responseDescription'] || response['message'] || response.inspect}"
    end

    { payment_url: response['paymentUrl'], reference: response['reference'] }
  end

  def generate_payment_link(email, amount, reference, currency: 'NGN')
    create_payment(
      email: email,
      amount: amount,
      reference: reference,
      callback_url: self.class.webhook_callback_url(reference)
    )[:payment_url]
  end

  # Server-side confirmation of a charge. RexPay callbacks carry no signature,
  # so this is the source of truth before crediting anything.
  def verify_transaction(reference)
    response = request(:post, '/api/cps/v1/getTransactionStatus', {
                         transactionReference: reference
                       })

    if response['responseCode'].to_s == SUCCESS_CODE
      {
        status: 'success',
        amount: response['amount'].to_f, # major units of `currency`
        currency: response['currency'],
        fees: response['fees'].to_f,
        channel: response['channel']
      }
    else
      { status: 'failed', error: response['responseDescription'] || response['message'] }
    end
  end

  private

  def request(method, endpoint, body = nil)
    uri = URI("#{BASE_URL}#{endpoint}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == 'https'

    request = case method
              when :get then Net::HTTP::Get.new(uri)
              when :post then Net::HTTP::Post.new(uri)
              end

    request.basic_auth(@username, @secret_key)
    request['Content-Type'] = 'application/json'
    request.body = body.to_json if body

    response = http.request(request)
    JSON.parse(response.body)
  end
end

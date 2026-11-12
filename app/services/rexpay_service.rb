# frozen_string_literal: true

# Client for RexPay (Global Accelerex) — card payments via hosted redirect checkout.
# Docs: https://rexpay-docs.globalaccelerex.com/docs
#
# Auth is HTTP Basic: account email as username, secret key as password.
# Amounts are in MAJOR units (naira, not kobo).
# RexPay exposes no refund, transfer or token-recharge API; those flows are manual.
class RexpayService
  # createPayment lives on the PGS service...
  BASE_URL = ENV.fetch('REXPAY_BASE_URL', 'https://pgs-sandbox.globalaccelerex.com')
  # ...but getTransactionStatus lives on the separate CPS service, on a different
  # host in production (pgs.globalaccelerex.com vs cps.globalaccelerex.com).
  # Default by swapping the `pgs` host prefix for `cps`; override with env if needed.
  CPS_BASE_URL = ENV.fetch('REXPAY_CPS_BASE_URL', BASE_URL.sub('//pgs', '//cps'))

  SUCCESS_CODE = '00'

  # RexPay's processing fee. Domestic Nigerian accounts charge in NGN, and we
  # gross the fee onto the amount so the customer pays it (not our settlement).
  # Tune to the account's actual rate via env.
  FEE_PERCENT = ENV.fetch('REXPAY_FEE_PERCENT', '1.5').to_f
  FEE_CAP_NGN = ENV.fetch('REXPAY_FEE_CAP_NGN', '0').to_f # 0 = uncapped

  def initialize
    @username = ENV['REXPAY_USERNAME']
    @secret_key = ENV['REXPAY_SECRET_KEY']
  end

  # Convert a USD amount to the NGN amount to charge, with the processing fee
  # added on top so it is borne by the customer.
  def self.ngn_charge_amount(usd_amount)
    base_ngn = usd_amount.to_f * FixerService.get_rate('USD', 'NGN')
    fee = base_ngn * FEE_PERCENT / 100.0
    fee = FEE_CAP_NGN if FEE_CAP_NGN.positive? && fee > FEE_CAP_NGN
    (base_ngn + fee).ceil
  end

  # Builds the callbackUrl passed to createPayment. Kept deliberately clean —
  # only our reference, no nested/URL-encoded query values, which RexPay rejects
  # as "inconsistent data". RexPay echoes the reference back and the webhook
  # rebuilds the frontend success page from the looked-up record. The second arg
  # is accepted for caller compatibility but intentionally ignored.
  def self.webhook_callback_url(reference, _redirect_to = nil)
    "#{ENV['APP_URL']}/webhooks/rexpay?reference=#{CGI.escape(reference.to_s)}"
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
                         callbackUrl: params[:callback_url],
                         isV2: true # align the flag with the /v2/ endpoint so the v2 checkout accepts the txn
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
    # getTransactionStatus is on the CPS service (different host from createPayment).
    response = request(:post, '/api/cps/v1/getTransactionStatus', {
                         transactionReference: reference
                       }, base_url: CPS_BASE_URL)

    if response['responseCode'].to_s == SUCCESS_CODE
      {
        status: 'success',
        amount: response['amount'].to_f, # major units of `currency`
        currency: response['currency'],
        fees: response['fees'].to_f,
        channel: response['channel']
      }
    else
      { status: 'failed', error: response['responseDescription'] || response['responseMessage'] || response['message'] }
    end
  end

  private

  def request(method, endpoint, body = nil, base_url: BASE_URL)
    uri = URI("#{base_url}#{endpoint}")
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

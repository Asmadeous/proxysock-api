# frozen_string_literal: true

require 'test_helper'

class BachsServiceTest < ActiveSupport::TestCase
  setup do
    @service = BachsService.new(api_key: 'sk_sandbox_test')
  end

  def http_response(code, body)
    stub(code: code, success?: (200..299).cover?(code), parsed_response: body, headers: { 'x-request-id' => 'req-1' })
  end

  def sign(body, secret, timestamp)
    OpenSSL::HMAC.hexdigest('SHA256', secret, "#{timestamp}.#{body}")
  end

  test 'payment_link creates a USD sandbox checkout with our reference and an idempotency key' do
    HTTParty.expects(:post).with(
      'https://sandbox-api.bachs.io/v1/checkout-sessions',
      has_entries(
        headers: has_entries('Authorization' => 'Bearer sk_sandbox_test', 'Idempotency-Key' => 'checkout-DEPabc'),
        body: { pricing: { currency: 'USD', amount: '12.50' }, customer: { email: 'a@example.com' },
                reference: 'DEPabc', success_url: 'https://proxysock.com/payments/success' }.to_json
      )
    ).returns(http_response(201, { 'checkout_id' => 'chk_1', 'checkout_url' => 'https://pay.example/c/1' }))

    link = @service.payment_link(amount: 12.5, reference: 'DEPabc', email: 'a@example.com',
                                 success_url: 'https://proxysock.com/payments/success')

    assert_equal({ url: 'https://pay.example/c/1', amount: 12.5, currency: 'USD', checkout_id: 'chk_1' }, link)
  end

  test 'payment_link leaves out success URLs Bachs refuses' do
    %w[http://localhost:3001/payments/success http://127.0.0.1:3001/x http://192.168.1.4/x].each do |url|
      HTTParty.expects(:post).with(anything, has_entry(body: Not(regexp_matches(/success_url/))))
              .returns(http_response(201, { 'checkout_id' => 'chk_1', 'checkout_url' => 'https://pay.example/c/1' }))

      @service.payment_link(amount: 5, reference: 'DEPx', email: 'a@example.com', success_url: url)
    end
  end

  test 'live keys use the production API' do
    HTTParty.expects(:get).with('https://api.bachs.io/v1/checkout-sessions/chk_1', anything)
            .returns(http_response(200, { 'checkout_id' => 'chk_1' }))

    BachsService.new(api_key: 'sk_live_test').checkout('chk_1')
  end

  test 'create_refund sends the amount as a decimal string' do
    HTTParty.expects(:post).with(
      'https://sandbox-api.bachs.io/v1/refunds',
      has_entries(headers: has_entry('Idempotency-Key', 'refund-REF1'),
                  body: { charge_id: 'ch_1', reference: 'REF1', amount: '7.00' }.to_json)
    ).returns(http_response(201, { 'refund_id' => 'rfnd_1', 'status' => 'processing' }))

    assert_equal 'rfnd_1', @service.create_refund(charge_id: 'ch_1', reference: 'REF1', amount: 7)['refund_id']
  end

  test 'raises with the status and Bachs error code, without the key' do
    HTTParty.expects(:post).returns(http_response(409, { 'error_code' => 'CONFLICT', 'detail' => 'A refund already exists' }))

    error = assert_raises(BachsService::Error) { @service.create_refund(charge_id: 'ch_1', reference: 'REF1') }
    assert_equal 409, error.status
    assert_equal 'CONFLICT', error.error_code
    assert_includes error.message, 'A refund already exists'
    assert_not_includes error.message, 'sk_sandbox_test'
  end

  test 'turns a deposit limit refusal into LimitExceeded with a message for the customer' do
    HTTParty.expects(:post).returns(http_response(400, {
                                                    'error_code' => 'DEPOSIT_LIMIT_EXCEEDED',
                                                    'detail' => 'This 6000.00 USD payment exceeds your deposit limit of 5000.00 USD. ' \
                                                                'Reduce the amount or contact support@bachs.io.',
                                                    'details' => { 'requested_amount' => '6000.00',
                                                                   'max_allowed_amount' => '5000.00', 'currency' => 'USD' }
                                                  }))

    error = assert_raises(BachsService::LimitExceeded) do
      @service.payment_link(amount: 6000, reference: 'DEPbig', email: 'a@example.com')
    end
    assert_equal 'DEPOSIT_LIMIT_EXCEEDED', error.error_code
    assert_includes error.message, '5000.00 USD'
    assert_not_includes error.message, 'support@bachs.io'
  end

  # Shapes read from a paid sandbox checkout: the payment's amount includes the fee.
  test 'amount_owed is what the payment is still short by' do
    paid = { 'charge' => { 'amount' => '5.075000', 'amount_paid' => '5.075000', 'amount_remaining' => '0.000000' } }
    accepted_short = { 'charge' => { 'amount' => '20.00', 'amount_paid' => '12.00', 'amount_remaining' => '0.00' } }
    overpaid = { 'charge' => { 'amount' => '20.00', 'amount_paid' => '25.00', 'amount_remaining' => '0.00' } }

    assert_equal 0, BachsService.amount_owed(paid)
    assert_equal 8, BachsService.amount_owed(accepted_short)
    assert_equal 0, BachsService.amount_owed(overpaid)
  end

  test 'wraps timeouts without a status' do
    HTTParty.expects(:get).raises(Net::ReadTimeout)

    error = assert_raises(BachsService::Error) { @service.checkout('chk_1') }
    assert_nil error.status
  end

  test 'valid_signature? accepts any matching v1 within the tolerance' do
    body = '{"id":"evt_1"}'
    header = "t=1760000000,v1=#{'0' * 64},v1=#{sign(body, 'whsec_new', 1_760_000_000)}"

    assert BachsService.valid_signature?(body, header, 'whsec_new', now: 1_760_000_010)
  end

  test 'valid_signature? rejects a wrong secret, a stale timestamp, and missing values' do
    body = '{"id":"evt_1"}'
    header = "t=1760000000,v1=#{sign(body, 'whsec_real', 1_760_000_000)}"

    assert_not BachsService.valid_signature?(body, header, 'whsec_other', now: 1_760_000_000)
    assert_not BachsService.valid_signature?(body, header, 'whsec_real', now: 1_760_000_301)
    assert_not BachsService.valid_signature?("#{body} ", header, 'whsec_real', now: 1_760_000_000)
    assert_not BachsService.valid_signature?(body, nil, 'whsec_real')
    assert_not BachsService.valid_signature?(body, header, nil)
  end
end

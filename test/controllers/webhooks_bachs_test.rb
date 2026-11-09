# frozen_string_literal: true

require 'test_helper'

class WebhooksBachsTest < ActionDispatch::IntegrationTest
  SECRET = 'whsec_test_secret'

  setup do
    @previous_secret = ENV['BACHS_WEBHOOK_SECRET']
    ENV['BACHS_WEBHOOK_SECRET'] = SECRET
    @body = { id: 'evt_1', type: 'checkout.completed', data: { checkout_id: 'chk_1', payment_status: 'paid' } }.to_json
  end

  teardown do
    ENV['BACHS_WEBHOOK_SECRET'] = @previous_secret
  end

  def deliver(signature_header)
    post '/webhooks/bachs', params: @body,
                            headers: { 'CONTENT_TYPE' => 'application/json', 'X-Bachs-Signature-V2' => signature_header }.compact
  end

  def valid_header
    timestamp = Time.current.to_i
    "t=#{timestamp},v1=#{OpenSSL::HMAC.hexdigest('SHA256', SECRET, "#{timestamp}.#{@body}")}"
  end

  test 'processes a correctly signed event' do
    BachsWebhookService.any_instance.expects(:process!).once

    deliver(valid_header)

    assert_response :ok
  end

  test 'rejects a bad or missing signature without processing' do
    BachsWebhookService.any_instance.expects(:process!).never

    deliver("t=#{Time.current.to_i},v1=#{'0' * 64}")
    assert_response :bad_request

    deliver(nil)
    assert_response :bad_request
  end

  test 'rejects everything when no secret is configured' do
    ENV['BACHS_WEBHOOK_SECRET'] = nil
    BachsWebhookService.any_instance.expects(:process!).never

    deliver(valid_header)

    assert_response :bad_request
  end

  test 'answers 503 so Bachs redelivers when the payment cannot be confirmed yet' do
    BachsWebhookService.any_instance.stubs(:process!).raises(BachsWebhookService::NotReady)

    deliver(valid_header)

    assert_response :service_unavailable
  end
end

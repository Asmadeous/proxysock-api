# frozen_string_literal: true

require 'test_helper'

class MeisimServiceTest < ActiveSupport::TestCase
  setup do
    @service = MeisimService.new(api_key: 'msa_test_key')
  end

  def http_response(code, body)
    stub(code: code, success?: (200..299).cover?(code), parsed_response: body)
  end

  test 'products returns the catalogue and sends the dealer key' do
    HTTParty.expects(:get).with(
      'https://api.meisimusa.com/mm/products',
      has_entries(headers: has_entry('x-dealer-key', 'msa_test_key'), timeout: MeisimService::TIMEOUT)
    ).returns(http_response(200, { 'ok' => true, 'products' => [{ 'productId' => 'ly:1023' }] }))

    assert_equal [{ 'productId' => 'ly:1023' }], @service.products
  end

  test 'wallet returns the wallet body' do
    HTTParty.expects(:get).returns(http_response(200, { 'ok' => true, 'balance' => 87.35 }))

    assert_in_delta 87.35, @service.wallet['balance']
  end

  test 'raises with status and MeiSIM message on 401' do
    HTTParty.expects(:get).returns(http_response(401, { 'error' => 'Unauthorized', 'message' => 'bad key' }))

    error = assert_raises(MeisimService::Error) { @service.wallet }
    assert_equal 401, error.status
    assert_includes error.message, 'Unauthorized: bad key'
    assert_not_includes error.message, 'msa_test_key'
  end

  test 'raises on 429 rate limit' do
    HTTParty.expects(:get).returns(http_response(429, { 'error' => 'Too many requests' }))

    error = assert_raises(MeisimService::Error) { @service.products }
    assert_equal 429, error.status
  end

  test 'raises on ok false' do
    HTTParty.expects(:get).returns(http_response(200, { 'ok' => false, 'error' => 'Account on hold' }))

    assert_raises(MeisimService::Error) { @service.wallet }
  end

  test 'wraps timeouts' do
    HTTParty.expects(:get).raises(Net::ReadTimeout)

    error = assert_raises(MeisimService::Error) { @service.products }
    assert_nil error.status
    assert_includes error.message, 'Net::ReadTimeout'
  end
  test 'qr_png returns the PNG bytes of a line and raises on 409' do
    HTTParty.expects(:get).with(
      'https://api.meisimusa.com/dealer/order/ord-1/qr?line=2&size=480',
      has_entries(headers: has_entry('x-dealer-key', 'msa_test_key'))
    ).returns(stub(code: 200, success?: true, headers: { 'content-type' => 'image/png' }, body: 'PNG'))
    assert_equal 'PNG', @service.qr_png('ord-1', line: 2)

    HTTParty.expects(:get).returns(stub(code: 409, success?: false, headers: { 'content-type' => 'application/json' },
                                        parsed_response: { 'error' => 'No QR' }))
    error = assert_raises(MeisimService::Error) { @service.qr_png('ord-1') }
    assert_equal 409, error.status
  end
  test 'esim_verify submits the codes and esim_verify_batch reads the progress' do
    HTTParty.expects(:post).with('https://api.meisimusa.com/dealer/esim-verify', has_entry(body: { lpas: ['LPA:1$X$Y'] }.to_json))
            .returns(http_response(200, { 'ok' => true, 'batch_id' => 'b-1', 'charged_usd' => 1.0 }))
    assert_equal 'b-1', @service.esim_verify(['LPA:1$X$Y'])['batch_id']

    HTTParty.expects(:get).with('https://api.meisimusa.com/dealer/esim-verify/b-1', anything)
            .returns(http_response(200, { 'ok' => true, 'progress' => { 'available' => 1 } }))
    assert_equal 1, @service.esim_verify_batch('b-1').dig('progress', 'available')
  end
  test 'topup, preview and statement call the documented paths' do
    HTTParty.expects(:get).with('https://api.meisimusa.com/dealer/topup/preview?net=100.0', anything)
            .returns(http_response(200, { 'ok' => true, 'fee' => 3.2 }))
    assert_in_delta 3.2, @service.topup_preview(100)['fee']

    HTTParty.expects(:post).with('https://api.meisimusa.com/dealer/topup', has_entry(body: { amountUsd: 100.0 }.to_json))
            .returns(http_response(200, { 'ok' => true, 'checkoutUrl' => 'https://checkout.stripe.com/x' }))
    assert_equal 'https://checkout.stripe.com/x', @service.topup(100)['checkoutUrl']

    HTTParty.expects(:get).with('https://api.meisimusa.com/dealer/statement?from=2026-09-01', anything)
            .returns(stub(code: 200, success?: true, body: "Date,Type\n"))
    assert_equal "Date,Type\n", @service.statement(from: '2026-09-01')
  end

  test 'logs each call by method, path and status, never the dealer key or the codes sent' do
    log = StringIO.new
    Rails.logger.stubs(:info).with { |line| log.puts(line) || true }
    HTTParty.expects(:post).returns(http_response(200, { 'ok' => true, 'batch_id' => 'b-1' }))

    @service.esim_verify(['LPA:1$X$SECRET'])

    assert_match(%r{\[MeiSIM\] POST /dealer/esim-verify -> 200 \(\d+ms\)}, log.string)
    assert_not_includes log.string, 'msa_test_key'
    assert_not_includes log.string, 'SECRET'
  end

  test 'top-up calls send one line by number or ICCID, and a listed network reply is accepted' do
    HTTParty.expects(:get).with('https://api.meisimusa.com/api/v1/topup/networks', anything)
            .returns(http_response(200, [{ 'NetworkName' => 'O2-UK' }]))
    assert_equal [{ 'NetworkName' => 'O2-UK' }], @service.topup_networks

    HTTParty.expects(:post).with('https://api.meisimusa.com/api/v1/topup/confirm',
                                 has_entry(body: { networkName: 'O2-UK', simSerialNumber: '8944' }.to_json))
            .returns(http_response(200, { 'TopUpList' => [10] }))
    @service.topup_confirm(network: 'O2-UK', iccid: '8944')

    HTTParty.expects(:post).with('https://api.meisimusa.com/api/v1/topup/recharge',
                                 has_entry(body: { networkName: 'ATT-US', contactNumber: '+1305', topUpValue: 20,
                                                   creditOnly: true }.to_json))
            .returns(http_response(200, { 'Status' => 'Success' }))
    @service.topup_recharge(network: 'ATT-US', number: '+1305', iccid: '8901', value: '20', credit_only: true)
  end

  test 'verify_verdict reads a one-code batch' do
    assert_equal 'pending', MeisimService.verify_verdict('pending' => 1)
    assert_equal 'used', MeisimService.verify_verdict('pending' => 0, 'used' => 1)
    assert_equal 'error', MeisimService.verify_verdict('error_count' => 1)
  end
end

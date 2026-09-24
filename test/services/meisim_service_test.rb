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
      has_entries(headers: has_entry('x-dealer-key', 'msa_test_key'), timeout: 30)
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
end

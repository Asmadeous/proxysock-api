# frozen_string_literal: true

require 'test_helper'

class EsimAccessServiceTest < ActiveSupport::TestCase
  setup { @service = EsimAccessService.new }

  def expect_order(package)
    @service.expects(:request).with do |method, path, body|
      method == :post && path == '/esim/order' && body[:packageInfoList] == [package]
    end.returns('success' => true, 'obj' => { 'orderNo' => 'B1' })
  end

  test 'orders without a price check unless a price is given' do
    expect_order(packageCode: 'JC098', count: 1)

    assert_equal 'B1', @service.order_esim('JC098')['orderNo']
  end

  test 'sends the price when the caller knows it' do
    expect_order(packageCode: 'JC098', count: 2, price: 170_000)

    @service.order_esim('JC098', 2, 170_000)
  end

  test 'raises with the eSIM Access error' do
    @service.stubs(:request).returns('success' => false, 'errorCode' => '200005', 'errorMessage' => 'Package price error')

    error = assert_raises(RuntimeError) { @service.order_esim('JC098') }
    assert_match(/Package price error \(code: 200005\)/, error.message)
  end
end

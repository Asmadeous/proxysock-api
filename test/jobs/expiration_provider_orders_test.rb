# frozen_string_literal: true

require 'test_helper'

class ExpirationProviderOrdersTest < ActiveJob::TestCase
  def vpn_order(end_time)
    user = create_user_with_balance(0)
    product = Product.create!(name: '1 x Residential VPN - 1 day', product_type: 'vpn', provider_type: 'myproxyapi',
                              available_to: 'both', product_category: product_categories(:three))
    pricing = ProductPricing.create!(product: product, currency: 'USD', selling_price: 1, active: true)
    Order.create!(orderable: user, product: product, product_pricing: pricing, quantity: 1, status: 'active',
                  total_amount: 1, metadata: { 'provider_order_id' => 'V1', 'my_proxy_api_response' => view(end_time) })
  end

  def view(end_time)
    { 'order' => { 'order_id' => 'V1', 'end_time' => end_time, 'timezone' => 'EEST' } }
  end

  setup do
    @client = mock('myproxyapi')
    MyProxyApiClient.stubs(:new).returns(@client)
  end

  test 'expires a MyProxyAPI order once the provider confirms its term is over' do
    order = vpn_order('2026-06-10 00:43:33')
    @client.expects(:view_vpn_order).with('V1').returns('data' => view('2026-06-10 00:43:33'))

    ExpirationCleanupJob.perform_now

    assert_equal 'expired', order.reload.status
    assert Notification.exists?(recipient: order.orderable, title: 'VPN Expired')
  end

  test 'keeps an order the provider has auto-renewed' do
    order = vpn_order('2026-06-10 00:43:33')
    renewed = 1.month.from_now.in_time_zone('Europe/Bucharest').strftime('%Y-%m-%d %H:%M:%S')
    @client.expects(:view_vpn_order).returns('data' => view(renewed))

    ExpirationCleanupJob.perform_now

    assert_equal 'active', order.reload.status
  end

  test 'waits for the next run when the provider cannot be reached' do
    order = vpn_order('2026-06-10 00:43:33')
    @client.expects(:view_vpn_order).raises(StandardError, 'timeout')

    ExpirationCleanupJob.perform_now

    assert_equal 'active', order.reload.status
  end

  test 'leaves orders whose term has not ended alone' do
    order = vpn_order(2.days.from_now.in_time_zone('Europe/Bucharest').strftime('%Y-%m-%d %H:%M:%S'))
    @client.expects(:view_vpn_order).never

    ExpirationCleanupJob.perform_now

    assert_equal 'active', order.reload.status
  end
end

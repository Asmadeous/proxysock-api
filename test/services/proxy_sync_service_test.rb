# frozen_string_literal: true

require 'test_helper'

class ProxySyncServiceTest < ActiveSupport::TestCase
  test 'syncs proxies from provider' do
    # Create dependencies for sync
    reseller = resellers(:one)
    order = Order.create!(orderable: reseller, product: products(:two), product_pricing: product_pricings(:pricing_two), status: 'active')
    MobileProxyOrder.create!(order: order)

    # Mock external API client - note: type must match 'mobile_proxy' for MobileProxy sync
    mock_data = [
      {
        'id' => 999,
        'ip' => '1.2.3.4',
        'port' => 8080,
        'username' => 'user',
        'password' => 'pass',
        'type' => 'mobile_proxy',
        'status' => 'available',
        'country' => 'US'
      }
    ]

    mock_client = mock
    mock_client.stubs(:fetch_proxies).returns(mock_data)
    MyProxyApiClient.stubs(:new).returns(mock_client)

    assert_difference 'MobileProxy.count', 1 do
      ProxySyncService.new.sync_all
    end

    proxy = MobileProxy.find_by(ip_address: '1.2.3.4')
    assert_not_nil proxy
    assert_equal '1.2.3.4', proxy.ip_address
    assert_equal 'US', proxy.country_code
  end

  test 'updates existing proxies' do
    # Create existing proxy
    # Create dependencies
    reseller = resellers(:one)
    order = Order.create!(
      orderable: reseller,
      product: products(:two),
      product_pricing: product_pricings(:pricing_two),
      status: 'active'
    )
    mp_order = MobileProxyOrder.create!(order: order)

    proxy = MobileProxy.create!(
      mobile_proxy_order: mp_order,
      ip_address: '1.2.3.4',
      port: 8080,
      username: 'old_user',
      password: 'old_pass',
      status: 'available',
      proxy_source: 'myproxyapi',
      myproxyapi_order_id: '123'
    )

    mock_data = [
      {
        'id' => 123,
        'ip' => '1.2.3.4',
        'port' => 8080,
        'username' => 'new_user',
        'password' => 'new_pass',
        'type' => 'mobile_proxy',
        'status' => 'available',
        'country' => 'US'
      }
    ]

    mock_client = mock
    mock_client.stubs(:fetch_proxies).returns(mock_data)
    MyProxyApiClient.stubs(:new).returns(mock_client)

    assert_no_difference 'MobileProxy.count' do
      ProxySyncService.new.sync_all
    end

    proxy.reload
    assert_equal 'new_user', proxy.username
  end
end

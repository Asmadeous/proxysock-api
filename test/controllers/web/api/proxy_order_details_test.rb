# frozen_string_literal: true

require 'test_helper'

module Web
  module Api
    # Proxy Management reads each order's connection details from the order list.
    class ProxyOrderDetailsTest < ActionDispatch::IntegrationTest
      # The shape MyProxyAPI's view-order call returns, as stored on the order.
      VIEW = {
        'ips' => ['74.91.49.93:23061:fxq4r1wbz0:secret1', '74.91.49.94:23062:fxq4r1wbz0:secret1'],
        'ips_info' => ['74.91.49.93 - US, New York, NY', '74.91.49.94 - US, New York, NY'],
        'order' => { 'order_id' => 'A1F4LTYCDKKKWTULXTJK', 'end_time' => '2026-06-13 11:19:46' },
        'config' => {
          'proxy_format' => 'socks5',
          'auth_user_pass' => { 'username' => 'fxq4r1wbz0', 'password' => 'secret1' },
          'auth_whitelistip' => [{ 'auth_id' => 1, 'ip_address' => '203.0.113.7' }]
        }
      }.freeze

      setup do
        @user = create_user_with_balance(0)
        product = Product.create!(name: '1 x Datacenter Proxy', product_type: 'datacenter', provider_type: 'myproxyapi',
                                  available_to: 'both', product_category: product_categories(:three))
        pricing = ProductPricing.create!(product: product, currency: 'USD', selling_price: 5, active: true)
        @order = Order.create!(orderable: @user, product: product, product_pricing: pricing, quantity: 1,
                               status: 'active', total_amount: 5,
                               metadata: { 'period' => 3,
                                           'my_proxy_api_response' => VIEW.deep_dup })
      end

      test 'order list carries the credentials, protocol, location and whitelist' do
        get '/web/api/orders', params: { product_type: 'proxy' }, headers: auth_header(@user)

        assert_response :success
        order = json_response['orders'].find { |o| o['id'] == @order.id }
        assert_equal 'fxq4r1wbz0', order.dig('credentials', 'username')
        assert_equal 'secret1', order.dig('credentials', 'password')
        assert_equal VIEW['ips'], order.dig('credentials', 'endpoints')
        assert_equal 'socks5', order.dig('proxy_details', 'protocol')
        assert_equal ['203.0.113.7'], order.dig('proxy_details', 'whitelist_ips')
        assert_equal 'US, New York, NY', order['country']
        assert_equal 'A1F4LTYCDKKKWTULXTJK', order['provider_order_id']
      end

      test 'credentials endpoint returns the host and port for every proxy type' do
        get "/web/api/orders/#{@order.id}/credentials", headers: auth_header(@user)

        assert_response :success
        assert_equal '74.91.49.93', json_response['ip']
        assert_equal '23061', json_response['port']
        assert_equal 'socks5', json_response['protocol']
      end
    end
  end
end

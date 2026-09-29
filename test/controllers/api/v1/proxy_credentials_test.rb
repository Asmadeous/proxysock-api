# frozen_string_literal: true

require 'test_helper'

module Api
  module V1
    class ProxyCredentialsTest < ActionDispatch::IntegrationTest
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

      test 'reseller gets MyProxyAPI credentials, mobile proxies included' do
        reseller = create_reseller_with_balance(0)
        product = Product.create!(name: 'Mobile Proxy', product_type: 'mobile', provider_type: 'myproxyapi',
                                  available_to: 'both', product_category: product_categories(:three))
        pricing = ProductPricing.create!(product: product, currency: 'USD', selling_price: 5, active: true)
        order = Order.create!(orderable: reseller, product: product, product_pricing: pricing, quantity: 1,
                              status: 'active', total_amount: 5,
                              metadata: { 'my_proxy_api_response' => VIEW.deep_dup })

        get "/api/v1/orders/#{order.id}/credentials", headers: auth_header(reseller)

        assert_response :success
        assert_equal 'socks5', json_response['protocol']
        assert_equal({ 'ip_address' => '74.91.49.93', 'port' => '23061', 'username' => 'fxq4r1wbz0',
                       'password' => 'secret1' }, json_response['proxies'].first)
        assert_equal 2, json_response['proxies'].size
      end
      test 'reseller order list returns proxy orders with their credentials' do
        reseller = create_reseller_with_balance(0)
        product = Product.create!(name: 'Datacenter Proxy', product_type: 'datacenter', provider_type: 'myproxyapi',
                                  available_to: 'both', product_category: product_categories(:three))
        pricing = ProductPricing.create!(product: product, currency: 'USD', selling_price: 5, active: true)
        order = Order.create!(orderable: reseller, product: product, product_pricing: pricing, quantity: 1,
                              status: 'active', total_amount: 5,
                              metadata: { 'my_proxy_api_response' => VIEW.deep_dup })

        get '/api/v1/orders', params: { product_type: 'proxy' }, headers: auth_header(reseller)

        assert_response :success
        listed = json_response['orders'].find { |o| o['id'] == order.id }
        assert_equal 'fxq4r1wbz0', listed.dig('credentials', 'username')
        assert_equal 2, listed.dig('credentials', 'endpoints').size
      end
    end
  end
end

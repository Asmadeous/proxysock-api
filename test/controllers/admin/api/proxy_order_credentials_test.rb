# frozen_string_literal: true

require 'test_helper'

module Admin
  module Api
    # Admin Proxy Management reads each order's IP, port and login from the order list.
    class ProxyOrderCredentialsTest < ActionDispatch::IntegrationTest
      setup do
        employee = Employee.create!(email: "staff_#{SecureRandom.hex(4)}@test.com", first_name: 'Sam', last_name: 'Staff',
                                    role: 'admin', active: true, department: departments(:one))
        @headers = { 'Authorization' => "Bearer #{JWT.encode({ employee_id: employee.id }, Rails.application.secret_key_base, 'HS256')}" }
        @user = create_user_with_balance(0)
      end

      def proxy_order(provider:, type: 'static_residential', metadata: {})
        product = Product.create!(name: 'Test Proxy', product_type: type, provider_type: provider,
                                  available_to: 'both', product_category: product_categories(:three))
        pricing = ProductPricing.create!(product: product, currency: 'USD', selling_price: 5, active: true)
        Order.create!(orderable: @user, product: product, product_pricing: pricing, quantity: 1, status: 'active',
                      total_amount: 5, metadata: metadata)
      end

      def listed(order)
        get '/admin/api/orders', params: { product_type: 'proxy' }, headers: @headers
        assert_response :success
        json_response['orders'].find { |o| o['id'] == order.id }
      end

      test 'MyProxyAPI proxies show the stored login and endpoint' do
        view = { 'ips' => ['74.91.49.93:23061:user1:pass1'],
                 'config' => { 'proxy_format' => 'http', 'auth_user_pass' => { 'username' => 'user1', 'password' => 'pass1' } } }
        order = proxy_order(provider: 'myproxyapi', metadata: { 'my_proxy_api_response' => view })

        creds = listed(order)['credentials']

        assert_equal %w[74.91.49.93 23061 user1 pass1], creds.values_at('ip', 'port', 'username', 'password')
      end

      test 'other proxies show their local record' do
        order = proxy_order(provider: 'inhouse', type: 'datacenter')
        proxy_order = StaticDatacenterProxyOrder.create!(order: order)
        StaticDatacenterProxy.create!(static_datacenter_proxy_order: proxy_order, order_id: order.id, ip_address: '10.1.2.3', port: 8080, username: 'u2', password: 'p2',
                                      protocol: 'http')

        creds = listed(order)['credentials']

        assert_equal ['10.1.2.3', 8080, 'u2', 'p2'], creds.values_at('ip', 'port', 'username', 'password')
      end
    end
  end
end

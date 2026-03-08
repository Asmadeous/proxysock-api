# frozen_string_literal: true

require 'test_helper'

module Api
  module V1
    class OrdersControllerTest < ActionDispatch::IntegrationTest
      setup do
        @reseller = resellers(:one)
        wallet = @reseller.wallets.find_by(wallet_type: 'main') || Wallet.create!(owner: @reseller, wallet_type: 'main')
        txn = Transaction.create!(transactable: @reseller, reference: @reseller, amount: 500.0,
                                  transaction_type: 'credit', status: 'success', currency: 'USD', description: 'Init')
        wallet.credit!(500.0, 'Init', {}, txn)

        # Mock MyProxyApiClient to avoid network requests and ENV errors
        @proxy_client_mock = mock('MyProxyApiClient')
        MyProxyApiClient.stubs(:new).returns(@proxy_client_mock)
        @proxy_client_mock.stubs(:place_order).returns({ 'data' => { 'order_id' => 'test_order_123' } })
        @proxy_client_mock.stubs(:view_order).returns({ 'data' => { 'ip' => '1.2.3.4', 'port' => 8080, 'username' => 'u', 'password' => 'p' } })

        @vm_product = products(:one)
        @pricing = product_pricings(:pricing_one)
      end

      test 'should list orders' do
        get '/api/v1/orders', headers: auth_header(@reseller)

        assert_response :success
        assert json_response.key?('orders')
      end

      test 'should create VM order' do
        post '/api/v1/orders',
             params: { product_id: @vm_product.id },
             headers: auth_header(@reseller)

        flunk "FAILED: #{response.body}" if response.status != 201
        assert_response :created
        assert_not_nil json_response['id']
      end

      test 'should fail to create order for non-VM product' do
        post '/api/v1/orders',
             params: { product_id: products(:two).id },
             headers: auth_header(@reseller)

        # Should return 404 because proxy is not available for resellers
        assert_response :not_found
      end

      test 'should fail without authentication' do
        get '/api/v1/orders'

        assert_response :unauthorized
      end

      test 'should get order credentials' do
        # Create an active order with a VM
        order = Order.create!(
          orderable: @reseller,
          product: @vm_product,
          product_pricing: @pricing,
          status: 'active'
        )

        vm_order = VmOrder.create!(
          order: order,
          os_type: 'ubuntu',
          vm_type: 'shared',
          status: 'active'
        )

        vm_order.create_vm!(
          status: 'active',
          ip_address: '192.168.1.100',
          ssh_username: 'root',
          ssh_password: 'secret123',
          ssh_port: 22
        )

        get "/api/v1/orders/#{order.id}/credentials", headers: auth_header(@reseller)

        assert_response :success
        assert_equal 'vm', json_response['type']
        assert_equal '192.168.1.100', json_response['ip_address']
      end
    end
  end
end

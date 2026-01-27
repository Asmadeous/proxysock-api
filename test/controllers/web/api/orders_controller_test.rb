# frozen_string_literal: true

require 'test_helper'

module Web
  module Api
    class OrdersControllerTest < ActionDispatch::IntegrationTest
      setup do
        @user = users(:one)
        wallet = Wallet.find_or_create_by!(owner: @user)
        unless @user.wallet
             # Logic if needed
        end
        # Ensure balance
        txn = Transaction.create!(transactable: @user, reference: @user, amount: 100.0, transaction_type: 'credit', status: 'success', currency: 'USD', description: 'Init')
        wallet.credit!(100.0, 'Init', {}, txn)

        @proxy_product = products(:two)
        
        # Mock XProxyService
        XProxyService.any_instance.stubs(:provision).returns(true)
      end

      test 'should create order with wallet payment' do
        assert_difference 'Order.count', 1 do
          post '/web/api/orders',
               params: {
                 product_id: @proxy_product.id,
                 payment_method: 'wallet'
               },
               headers: auth_header(@user)
        end

        assert_response :created
        assert_equal 'active', json_response['status'] # Proxies provision immediately if available
      end

      test 'should fail if wallet balance insufficient' do
        # Create fresh user with low balance
        low_balance_user = User.create!(first_name: 'Low', last_name: 'Balance', email: 'low@test.com', password: 'password123')
        wallet = Wallet.create!(owner: low_balance_user)
        txn = Transaction.create!(transactable: low_balance_user, reference: low_balance_user, amount: 5.0, transaction_type: 'credit', status: 'success', currency: 'USD', description: 'Init')
        wallet.credit!(5.0, 'Init', {}, txn) # 5.0 < 10.0 (Proxy price)

        post '/web/api/orders',
             params: {
               product_id: @proxy_product.id,
               payment_method: 'wallet'
             },
             headers: auth_header(low_balance_user)

        assert_response :payment_required
        assert_match(/Insufficient balance/, json_response['error'])
      end

      test 'should create order with gateway payment' do
        # Gateway flow might return payment URL instead of active order
        post '/web/api/orders',
             params: {
               product_id: @proxy_product.id,
               payment_method: 'paystack' # or gateway
             },
             headers: auth_header(@user)

        assert_response :accepted # or success depending on implementation
        assert json_response.key?('payment_url')
      end
    end
  end
end

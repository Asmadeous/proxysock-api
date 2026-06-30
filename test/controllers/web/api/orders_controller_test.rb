# frozen_string_literal: true

require 'test_helper'

module Web
  module Api
    class OrdersControllerTest < ActionDispatch::IntegrationTest
      include ActiveJob::TestHelper

      setup do
        @user = users(:one)
        wallet = @user.wallets.find_by(wallet_type: 'main') || Wallet.create!(owner: @user, wallet_type: 'main')
        # Ensure balance
        txn = Transaction.create!(transactable: @user, reference: @user, amount: 100.0, transaction_type: 'credit',
                                  status: 'success', currency: 'USD', description: 'Init')
        wallet.credit!(100.0, 'Init', {}, txn)

        @proxy_product = products(:two)

        # Mock XProxyService
        XProxyService.any_instance.stubs(:provision).returns(true)
      end

      test 'should create order with wallet payment' do
        assert_difference 'Order.count', 1 do
          assert_enqueued_with(job: OrderProvisioningJob) do
            post '/web/api/orders',
                 params: {
                   product_id: @proxy_product.id,
                   payment_method: 'wallet'
                 },
                 headers: auth_header(@user)
          end
        end

        assert_response :created
        # Provisioning now runs in a background job (OrderProvisioningJob) rather
        # than inline — inline provisioning could block on the provider's
        # IP-assignment sleep and time out the request — so the order is returned
        # `pending` and provisioned asynchronously.
        assert_equal 'pending', json_response['status']
      end

      test 'should fail if wallet balance insufficient' do
        # Create fresh user with low balance
        low_balance_user = User.create!(first_name: 'Low', last_name: 'Balance', username: 'low_balance',
                                        email: 'low@test.com', password: 'password123', country_code: 'US', city: 'New York')
        wallet = low_balance_user.wallets.find_by(wallet_type: 'main') || Wallet.create!(owner: low_balance_user,
                                                                                         wallet_type: 'main')
        txn = Transaction.create!(transactable: low_balance_user, reference: low_balance_user, amount: 5.0,
                                  transaction_type: 'credit', status: 'success', currency: 'USD', description: 'Init')
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

# frozen_string_literal: true

require 'test_helper'

module Web
  module Api
    class WalletsControllerTest < ActionDispatch::IntegrationTest
      setup do
        @user = create_user_with_balance(0)
        wallet = @user.wallets.find_by(wallet_type: 'main')
        txn = Transaction.create!(
          transactable: @user,
          reference: @user,
          amount: 100.0,
          transaction_type: 'credit',
          status: 'success',
          currency: 'USD',
          description: 'Init'
        )
        wallet.credit!(100.0, 'Init', {}, txn)
      end

      test 'should get balance' do
        get '/web/api/wallet', headers: auth_header(@user)

        assert_response :success
        assert_equal 100.0, json_response['balance'].to_f
      end

      test 'should initiate deposit' do
        post '/web/api/wallet/deposit',
             params: { amount: 100.0, gateway: 'rexpay' },
             headers: auth_header(@user)

        assert_response :success
        assert_not_nil json_response['payment_url']
      end

      test 'refuses a Bachs deposit over the Bachs limit and closes the pending deposit' do
        BachsService.any_instance.stubs(:payment_link)
                    .raises(BachsService::LimitExceeded.new('This amount is over the Bachs limit of 5000.00 USD per payment.'))

        post '/web/api/wallet/deposit', params: { amount: 6000.0, gateway: 'bachs' }, headers: auth_header(@user)

        assert_response :unprocessable_entity
        assert_includes json_response['error'], '5000.00 USD'
        assert_equal 'failed', Deposit.where(depositable: @user).last.status
      end

      test 'should list transactions' do
        # Create some transactions
        txn = Transaction.create!(
          transactable: @user,
          reference: @user,
          amount: 10.0,
          transaction_type: 'credit',
          status: 'success',
          currency: 'USD',
          description: 'Deposit'
        )
        @user.wallet.credit!(10.0, 'Deposit', {}, txn)

        get '/web/api/wallet', headers: auth_header(@user)

        assert_response :success
        assert_not_empty json_response['recent_transactions']
      end
    end
  end
end

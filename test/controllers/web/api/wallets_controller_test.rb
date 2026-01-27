# frozen_string_literal: true

require 'test_helper'

module Web
  module Api
    class WalletsControllerTest < ActionDispatch::IntegrationTest
      setup do
        @user = users(:one)
        txn = Transaction.create!(
          transactable: @user,
          reference: @user,
          amount: 50.0,
          transaction_type: 'credit',
          status: 'success',
          currency: 'USD',
          description: 'Initial Balance'
        )
        Wallet.find_or_create_by!(owner: @user).credit!(50.0, 'Initial Balance', {}, txn) unless @user.wallet
      end

      test 'should get balance' do
        get '/web/api/wallet', headers: auth_header(@user)

        assert_response :success
        assert_equal 100.0, json_response['balance'].to_f
      end

      test 'should initiate deposit' do
        post '/web/api/wallet/deposit',
             params: { amount: 100.0, gateway: 'paystack' },
             headers: auth_header(@user)

        assert_response :success
        assert_not_nil json_response['payment_url']
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

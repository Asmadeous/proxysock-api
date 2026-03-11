# frozen_string_literal: true

require 'test_helper'

module Api
  module V1
    class AuthControllerTest < ActionDispatch::IntegrationTest
      setup do
        @reseller = Reseller.create!(
          company_name: 'Test Reseller',
          username: 'test_reseller',
          email: 'test@reseller.com',
          password: 'password123',
          reseller_type: 'api_only'
        )
        # Use the automatically initialized wallet
        wallet = @reseller.wallet
        txn = Transaction.create!(transactable: @reseller, reference: @reseller, amount: 500.0,
                                  transaction_type: 'credit', status: 'success', currency: 'USD', description: 'Init')
        wallet.credit!(500.0, 'Init', {}, txn)

        @pricing = product_pricings(:pricing_one)
      end

      test 'should get token with valid credentials' do
        post '/api/v1/auth/token', params: {
          email: @reseller.email,
          password: 'password123'
        }

        assert_response :success
        assert_not_nil json_response['token']
      end

      test 'should fail with invalid credentials' do
        post '/api/v1/auth/token', params: {
          email: @reseller.email,
          password: 'wrongpassword'
        }

        assert_response :unauthorized
      end

      test 'should refresh token with valid refresh token' do
        # First get a token
        post '/api/v1/auth/token', params: {
          email: @reseller.email,
          password: 'password123'
        }

        refresh_token = json_response['refresh_token']

        post '/api/v1/auth/refresh', params: {
          refresh_token: refresh_token
        }, headers: { 'Authorization' => "Bearer #{json_response['token']}" }

        assert_response :success
        assert_not_nil json_response['token']
      end

      test 'should reject invalid refresh token' do
        post '/api/v1/auth/refresh', params: {
          refresh_token: 'invalid-token'
        }

        assert_response :unauthorized
      end
    end
  end
end

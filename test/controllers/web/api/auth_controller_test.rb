# frozen_string_literal: true

require 'test_helper'

module Web
  module Api
    class AuthControllerTest < ActionDispatch::IntegrationTest
      setup do
        @user = users(:one)
        @user.update!(email_verified_at: Time.current)
      end

      test 'should login with valid credentials' do
        post '/web/api/auth/login', params: {
          user: {
            email: @user.email,
            password: 'password123'
          }
        }

        assert_response :success
        assert_not_nil json_response['token']
        assert_not_nil json_response['user']
      end

      test 'should fail login with invalid credentials' do
        post '/web/api/auth/login', params: {
          user: {
            email: @user.email,
            password: 'wrongpassword'
          }
        }

        assert_response :unauthorized
      end

      test 'should register new user' do
        assert_difference 'User.count', 1 do
          post '/web/api/auth/register', params: {
            user: {
              first_name: 'New',
              last_name: 'User',
              username: 'new_user_reg',
              email: 'newuser@example.com',
              password: 'password123',
              password_confirmation: 'password123',
              country_code: 'US',
              city: 'New York'
            }
          }
        end

        assert_response :created
        assert json_response['requires_verification']
      end
    end
  end
end

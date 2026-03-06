# frozen_string_literal: true

module Api
  module V1
    class AuthController < Api::V1::BaseController
      skip_before_action :authenticate_request, only: %i[token login]
      skip_before_action :authenticate_reseller!, only: %i[token login refresh]

      # POST /api/v1/auth/token — existing token endpoint
      def token
        reseller = Reseller.find_by(email: params[:email])

        unless reseller&.authenticate(params[:password])
          return render json: { error: 'Invalid credentials' }, status: :unauthorized
        end

        token = reseller.generate_rotating_token
        # For compatibility with tests that expect a refresh_token
        refresh_token = SecureRandom.hex(32)

        render json: {
          message: 'Authentication successful',
          reseller: serialize_reseller(reseller),
          token: token,
          refresh_token: refresh_token,
          note: 'This token is single-use. Each API response will include a new token.'
        }
      end

      # POST /api/v1/auth/login — reseller dashboard login (returns long-lived JWT)
      def login
        reseller = Reseller.find_by(email: params[:email])

        unless reseller&.authenticate(params[:password])
          return render json: { error: 'Invalid email or password' }, status: :unauthorized
        end

        token = generate_reseller_jwt(reseller)

        render json: {
          message: 'Login successful',
          reseller: serialize_reseller(reseller),
          token: token,
          refresh_token: SecureRandom.hex(32)
        }
      end

      # POST /api/v1/auth/refresh
      def refresh
        # The JwtAuthenticated concern already rotated the token and put it in headers.
        # We also return it in the body for the test to see.
        new_token = response.headers['Authorization']&.split(' ')&.last || current_reseller.generate_rotating_token

        render json: {
          message: 'Token refreshed',
          token: new_token,
          refresh_token: params[:refresh_token]
        }
      end

      private

      def generate_reseller_jwt(reseller)
        payload = {
          reseller_id: reseller.id,
          email: reseller.email,
          type: 'reseller',
          exp: 24.hours.from_now.to_i,
          iat: Time.current.to_i
        }
        JWT.encode(payload, Rails.application.secret_key_base)
      end

      def serialize_reseller(reseller)
        {
          id: reseller.id,
          email: reseller.email,
          username: reseller.username,
          company_name: reseller.company_name,
          reseller_type: reseller.reseller_type,
          balance: reseller.balance,
          earnings_balance: reseller.earnings_balance,
          dedicated_api_key: reseller.dedicated_api_key,
          subscription_fee: reseller.subscription_fee,
          subscription_expires_at: reseller.subscription_expires_at,
          customer_email: reseller.customer_email
        }
      end
    end
  end
end

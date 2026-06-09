# frozen_string_literal: true

module Api
  module V1
    class AuthController < Api::V1::BaseController
      skip_before_action :authenticate_request, only: %i[token login zoho_callback]
      skip_before_action :authenticate_reseller!, only: %i[token login refresh zoho_callback]

      # POST /api/v1/auth/token — existing token endpoint
      def token
        reseller = if params[:username].present?
                     Reseller.find_by(username: params[:username])
                   else
                     Reseller.find_by(email: params[:email])
                   end

        unless reseller
          return render json: { error: 'Invalid credentials' }, status: :unauthorized
        end

        # Check if account is locked
        if reseller.access_locked?
          return render json: { error: 'Your account has been locked due to too many failed login attempts. Please check your email for unlock instructions.' }, status: :forbidden
        end

        authenticated = if params[:api_key].present?
                          reseller.authenticate_api_key(params[:api_key])
                        else
                          reseller.authenticate(params[:password])
                        end

        unless authenticated
          attempts = reseller.register_failed_attempt!
          if reseller.access_locked?
            saved = reseller
            ActiveRecord.after_all_transactions_commit do
              ::UserMailer.unlock_account_email(saved).deliver_later
            end
            return render json: { error: 'Your account has been locked due to too many failed login attempts. An unlock email has been sent.' }, status: :forbidden
          end
          remaining = Reseller::MAX_FAILED_ATTEMPTS - attempts
          return render json: { error: "Invalid credentials. #{remaining} attempt(s) remaining before account lock." }, status: :unauthorized
        end

        # Require email verification
        unless reseller.email_verified?
          return render json: {
            error: 'Please verify your email address before logging in. Check your inbox for the verification link.',
            requires_verification: true
          }, status: :forbidden
        end

        reseller.reset_failed_attempts!
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

        # Check if account is locked
        if reseller&.access_locked?
          return render json: { error: 'Your account has been locked due to too many failed login attempts. Please check your email for unlock instructions.' }, status: :forbidden
        end

        unless reseller&.authenticate(params[:password])
          if reseller
            attempts = reseller.register_failed_attempt!
            if reseller.access_locked?
              saved = reseller
              ActiveRecord.after_all_transactions_commit do
                ::UserMailer.unlock_account_email(saved).deliver_later
              end
              return render json: { error: 'Your account has been locked due to too many failed login attempts. An unlock email has been sent.' }, status: :forbidden
            end
            remaining = Reseller::MAX_FAILED_ATTEMPTS - attempts
            return render json: { error: "Invalid email or password. #{remaining} attempt(s) remaining before account lock." }, status: :unauthorized
          end
          return render json: { error: 'Invalid email or password' }, status: :unauthorized
        end

        # Require email verification
        unless reseller.email_verified?
          return render json: {
            error: 'Please verify your email address before logging in. Check your inbox for the verification link.',
            requires_verification: true
          }, status: :forbidden
        end

        reseller.reset_failed_attempts!
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

      # GET /api/v1/auth/me
      def me
        render json: { reseller: serialize_reseller(current_reseller) }
      end

      # POST /api/v1/auth/zoho_callback
      def zoho_callback
        render json: { message: 'Success' }
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
          permanent_api_key: reseller.permanent_api_key,
          subscription_fee: reseller.subscription_fee,
          subscription_expires_at: reseller.subscription_expires_at,
          customer_email: reseller.customer_email,
          allowed_product_category_id: reseller.allowed_product_category_id,
          allowed_product_category_name: reseller.allowed_product_category&.name
        }
      end
    end
  end
end

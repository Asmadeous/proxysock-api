# frozen_string_literal: true

module Web
  module Api
    class AuthController < BaseController
      # POST /web/api/auth/register
      skip_before_action :authenticate_request, only: %i[register login google twitter google_callback twitter_callback failure]

      def register
        user = User.new(register_params)
        user.status = 'active'

        if user.save
          token = user.generate_jwt
          render json: {
            message: 'Registration successful',
            user: serialize_user(user),
            token: token
          }, status: :created
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # POST /web/api/auth/login
      def login
        user = User.find_by(email: login_params[:email])

        if user&.authenticate(login_params[:password])
          user.update(last_login_at: Time.current)
          token = user.generate_jwt

          render json: {
            message: 'Login successful',
            user: serialize_user(user),
            token: token
          }
        else
          render json: { error: 'Invalid email or password' }, status: :unauthorized
        end
      end

      # GET /web/api/auth/google (redirect to OAuth)
      def google
        redirect_to '/auth/google_oauth2', allow_other_host: true
      end

      # GET /web/api/auth/google/callback
      def google_callback
        auth = request.env['omniauth.auth']
        user = User.find_for_oauth(auth)

        user.update(last_login_at: Time.current)
        token = user.generate_jwt

        # Return token (or redirect to frontend with token)
        render json: {
          message: 'Google login successful',
          user: serialize_user(user),
          token: token
        }
      rescue StandardError => e
        render json: { error: "OAuth failed: #{e.message}" }, status: :unprocessable_entity
      end

      # GET /web/api/auth/twitter (redirect to OAuth)
      def twitter
        redirect_to '/auth/twitter2', allow_other_host: true
      end

      # GET /web/api/auth/twitter/callback
      def twitter_callback
        auth = request.env['omniauth.auth']
        user = User.find_for_oauth(auth)

        user.update(last_login_at: Time.current)
        token = user.generate_jwt

        render json: {
          message: 'Twitter login successful',
          user: serialize_user(user),
          token: token
        }
      rescue StandardError => e
        render json: { error: "OAuth failed: #{e.message}" }, status: :unprocessable_entity
      end

      # OAuth failure callback
      def failure
        render json: { error: params[:message] || 'Authentication failed' }, status: :unauthorized
      end

      private

      def register_params
        params.require(:user).permit(:email, :password, :password_confirmation, :first_name, :last_name, :phone)
      end

      def login_params
        params.require(:user).permit(:email, :password)
      end

      def serialize_user(user)
        {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          status: user.status
        }
      end
    end
  end
end

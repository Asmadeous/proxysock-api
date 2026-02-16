# frozen_string_literal: true

module Web
  module Api
    class AuthController < BaseController
      # POST /web/api/auth/register
      # POST /web/api/auth/register
      skip_before_action :authenticate_request, only: %i[register login google twitter google_callback twitter_callback failure verify_email forgot_password reset_password]

      def register
        user = User.new(register_params)
        user.status = 'pending'

        if user.save
          UserMailer.verification_email(user, user.generate_token_for(:email_verification)).deliver_later
          
          render json: {
            message: 'Registration successful. Please verify your email.',
            user: serialize_user(user)
          }, status: :created
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # POST /web/api/auth/verify_email
      def verify_email
        token = params[:token]
        user = User.find_by_token_for(:email_verification, token)

        if user
          user.update!(status: 'active', email_verified_at: Time.current)
          token = user.generate_jwt
          
          render json: {
            message: 'Email verified successfully',
            user: serialize_user(user),
            token: token
          }
        else
          render json: { error: 'Invalid or expired verification link' }, status: :unprocessable_entity
        end
      end

      # POST /web/api/auth/forgot_password
      def forgot_password
        user = User.find_by(email: params[:email])

        if user
          UserMailer.password_reset_email(user, user.generate_token_for(:password_reset)).deliver_later
        end

        # Always return success to prevent email enumeration
        render json: { message: 'If an account exists with this email, you will receive password reset instructions.' }
      end

      # POST /web/api/auth/reset_password
      def reset_password
        token = params[:token]
        user = User.find_by_token_for(:password_reset, token)

        if user && user.update(password: params[:password], password_confirmation: params[:password_confirmation])
          render json: { message: 'Password reset successfully. You can now login.' }
        else
          render json: { error: 'Invalid or expired reset link, or passwords do not match' }, status: :unprocessable_entity
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

      # GET /web/api/auth/me - Get current user
      def me
        render json: {
          user: serialize_user(current_user),
          wallet_balance: current_user.wallet&.balance || 0
        }
      end

      # POST /web/api/auth/refresh - Refresh JWT token
      def refresh
        # current_user is already authenticated via before_action
        token = current_user.generate_jwt

        render json: {
          message: 'Token refreshed',
          user: serialize_user(current_user),
          token: token
        }
      end

      # PUT /web/api/auth/me
      def update
        if current_user.update(register_params)
          # Update metadata fields
          meta = current_user.metadata || {}
          meta['country'] = params[:user][:country] if params[:user][:country].present?
          meta['city'] = params[:user][:city] if params[:user][:city].present?
          current_user.update(metadata: meta)

          render json: {
            message: 'Profile updated successfully',
            user: serialize_user(current_user)
          }
        else
          render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /web/api/auth/logout
      def logout
        # For stateless JWT, we just return success
        # Client should discard the token
        # If using session tracking, invalidate here
        current_user.user_sessions.where(active: true).update_all(active: false) if current_user.respond_to?(:user_sessions)

        render json: { message: 'Logged out successfully' }
      end

      # OAuth failure callback
      def failure
        render json: { error: params[:message] || 'Authentication failed' }, status: :unauthorized
      end

      private

      def register_params
        params.require(:user).permit(:email, :password, :password_confirmation, :first_name, :last_name, :username, :phone, :avatar)
      end

      def login_params
        params.require(:user).permit(:email, :password)
      end

      def serialize_user(user)
        meta = user.metadata || {}
        {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          avatar_url: user.avatar.attached? ? Rails.application.routes.url_helpers.rails_blob_url(user.avatar, only_path: true) : nil,
          status: user.status,
          country: meta['country'],
          city: meta['city'],
          created_at: user.created_at
        }
      end
    end
  end
end

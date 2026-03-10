# frozen_string_literal: true

module Web
  module Api
    class AuthController < BaseController
      # POST /web/api/auth/register
      skip_before_action :authenticate_request,
                         only: %i[register login check_username confirm_email resend_confirmation forgot_password reset_password google twitter
                                  google_callback twitter_callback failure]

      def register
        user = User.new(register_params)
        user.status = 'active'
        user.ip_address = request.remote_ip
        user.email_confirmation_token = SecureRandom.urlsafe_base64(32)

        if user.save
          # Send confirmation email
          UserMailer.confirmation_email(user).deliver_later

          token = user.generate_jwt
          render json: {
            message: 'Registration successful. Please check your email to confirm your account.',
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
          user.update(last_login_at: Time.current, ip_address: request.remote_ip)

          duration = if login_params[:remember_me].in?([true, 'true',
                                                        '1'])
                       30.days.from_now.to_i
                     else
                       24.hours.from_now.to_i
                     end

          token = user.generate_jwt(duration)

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

        frontend_url = ENV.fetch('FRONTEND_URL', 'http://localhost:3001')
        redirect_to "#{frontend_url}/auth/callback?auth_token=#{token}", allow_other_host: true
      rescue StandardError => e
        Rails.logger.error "OAuth Callback Error: #{e.message}"
        frontend_url = ENV.fetch('FRONTEND_URL', 'http://localhost:3001')
        redirect_to "#{frontend_url}/login?error=oauth_failed", allow_other_host: true
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

        frontend_url = ENV.fetch('FRONTEND_URL', 'http://localhost:3001')
        redirect_to "#{frontend_url}/auth/callback?auth_token=#{token}", allow_other_host: true
      rescue StandardError => e
        Rails.logger.error "OAuth Callback Error: #{e.message}"
        frontend_url = ENV.fetch('FRONTEND_URL', 'http://localhost:3001')
        redirect_to "#{frontend_url}/login?error=oauth_failed", allow_other_host: true
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
        token = current_user.generate_jwt

        render json: {
          message: 'Token refreshed',
          user: serialize_user(current_user),
          token: token
        }
      end

      # PATCH /web/api/auth/update_profile
      def update_profile
        permitted = params.permit(:username, :first_name, :last_name, :country, :city, :phone, :profile_picture_url)

        # Check username uniqueness if changed
        if permitted[:username].present? && permitted[:username] != current_user.username && User.where(
          'LOWER(username) = ? AND id != ?', permitted[:username].downcase, current_user.id
        ).exists?
          return render json: { error: 'Username is already taken' }, status: :unprocessable_entity
        end

        if current_user.update(permitted)
          render json: { message: 'Profile updated successfully', user: serialize_user(current_user) }
        else
          render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # POST /web/api/auth/change_password
      def change_password
        unless current_user.authenticate(params[:current_password])
          return render json: { error: 'Current password is incorrect' }, status: :unprocessable_entity
        end

        if params[:new_password].blank? || params[:new_password].length < 8
          return render json: { error: 'New password must be at least 8 characters' }, status: :unprocessable_entity
        end

        if params[:new_password] != params[:password_confirmation]
          return render json: { error: 'Password confirmation does not match' }, status: :unprocessable_entity
        end

        if current_user.update(password: params[:new_password], password_confirmation: params[:password_confirmation])
          render json: { message: 'Password changed successfully' }
        else
          render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /web/api/auth/logout
      def logout
        if current_user.respond_to?(:user_sessions)
          current_user.user_sessions.where(active: true).update_all(active: false)
        end
        render json: { message: 'Logged out successfully' }
      end

      # OAuth failure callback
      def failure
        render json: { error: params[:message] || 'Authentication failed' }, status: :unauthorized
      end

      # GET /web/api/auth/check_username?username=foo
      def check_username
        username = params[:username].to_s.strip
        if username.length < 3
          render json: { available: false, message: 'Username must be at least 3 characters' }
        elsif username.length > 30
          render json: { available: false, message: 'Username must be 30 characters or fewer' }
        elsif username !~ /\A[a-zA-Z0-9_]+\z/
          render json: { available: false, message: 'Only letters, numbers, and underscores allowed' }
        elsif User.where('LOWER(username) = ?', username.downcase).exists?
          render json: { available: false, message: 'Username is already taken' }
        else
          render json: { available: true, message: 'Username is available' }
        end
      end

      # GET /web/api/auth/confirm_email?token=xxx
      def confirm_email
        user = User.find_by(email_confirmation_token: params[:token])
        if user.nil?
          render json: { error: 'Invalid or expired confirmation token' }, status: :unprocessable_entity
        elsif user.email_verified_at.present?
          token = user.generate_jwt
          render json: { message: 'Email already confirmed', user: serialize_user(user), token: token }
        else
          user.update!(email_verified_at: Time.current, email_confirmation_token: nil)
          token = user.generate_jwt
          render json: { message: 'Email confirmed successfully', user: serialize_user(user), token: token }
        end
      end

      # POST /web/api/auth/resend_confirmation
      def resend_confirmation
        user = User.find_by(email: params[:email])
        if user.nil?
          render json: { message: 'If an account with that email exists, a confirmation email has been sent.' }
        elsif user.email_verified_at.present?
          render json: { message: 'Email is already confirmed.' }
        else
          user.update!(email_confirmation_token: SecureRandom.urlsafe_base64(32))
          UserMailer.confirmation_email(user).deliver_later
          render json: { message: 'Verification email resent! Check your inbox.' }
        end
      end

      # POST /web/api/auth/forgot_password
      def forgot_password
        user = User.find_by(email: params[:email])
        if user
          user.update!(
            password_reset_token: SecureRandom.urlsafe_base64(32),
            password_reset_sent_at: Time.current
          )
          UserMailer.password_reset_email(user).deliver_later
        end
        render json: { message: 'If an account with that email exists, password reset instructions have been sent.' }
      end

      # POST /web/api/auth/reset_password
      def reset_password
        user = User.find_by(password_reset_token: params[:token])
        if user.nil?
          render json: { error: 'Invalid or expired reset token' }, status: :unprocessable_entity
        elsif user.password_reset_sent_at < 2.hours.ago
          render json: { error: 'Reset token has expired. Please request a new one.' }, status: :unprocessable_entity
        elsif params[:password].blank? || params[:password].length < 8
          render json: { error: 'Password must be at least 8 characters' }, status: :unprocessable_entity
        elsif params[:password] != params[:password_confirmation]
          render json: { error: 'Password confirmation does not match' }, status: :unprocessable_entity
        else
          user.update!(
            password: params[:password],
            password_confirmation: params[:password_confirmation],
            password_reset_token: nil,
            password_reset_sent_at: nil
          )
          render json: { message: 'Password has been reset successfully. You can now log in.' }
        end
      end

      private

      def register_params
        params.require(:user).permit(:email, :password, :password_confirmation, :first_name, :last_name, :phone,
                                     :country, :city, :username, :profile_picture_url)
      end

      def login_params
        params.require(:user).permit(:email, :password, :remember_me)
      end

      def serialize_user(user)
        wallet = user.wallet
        {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          status: user.status,
          country: user.country,
          city: user.city,
          profile_picture_url: user.profile_picture_url,
          balance: wallet&.balance.to_f || 0.0,
          currency: wallet&.currency || 'USD'
        }
      end
    end
  end
end

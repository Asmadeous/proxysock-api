# frozen_string_literal: true

module Web
  module Api
    class AuthController < ActionController::Base
      include JwtAuthenticated
      include ErrorHandling
      # By default, Base includes forgery protection.
      # We skip it for API JSON requests using JWT, but keep it for browser-based SSO forms.
      protect_from_forgery with: :null_session, unless: -> { request.format.json? || request.headers['Authorization'].present? }
      # POST /web/api/auth/register
      skip_before_action :authenticate_request,
                         only: %i[register login check_username confirm_email resend_confirmation forgot_password reset_password google twitter
                                  google_callback twitter_callback failure unlock_account]

      def register
        # Extract referral_code before creating user (it's not a DB column)
        referral_code = params[:user][:referral_code]&.strip
        reseller_id = params[:user][:reseller_id]

        user = User.new(register_params)
        user.status = 'active'
        user.ip_address = request.remote_ip
        user.email_confirmation_token = SecureRandom.urlsafe_base64(32)

        # Handle signing up under a reseller (Infrastructure Resellers)
        if reseller_id.present?
          reseller = Reseller.find_by(id: reseller_id)
          if reseller&.infrastructure?
            user.reseller = reseller
            user.owner_type = 'reseller_managed'
          end
        end

        if user.save
          # Track affiliate referral if a referral code was provided
          if referral_code.present?
            begin
              AffiliateService.track_signup!(user, referral_code)
            rescue StandardError => e
              Rails.logger.warn "Referral tracking failed for code '#{referral_code}': #{e.message}"
            end
          end

          if user.avatar.attached?
            proxy_path = Rails.application.routes.url_helpers.rails_storage_proxy_path(user.avatar, only_path: true)
            user.update_column(:profile_picture_url, proxy_path)
          end

          # Send confirmation email
          saved_user = user
          ActiveRecord.after_all_transactions_commit do
            ::UserMailer.confirmation_email(saved_user).deliver_later
          end

          render json: {
            message: 'Registration successful. Please check your email to verify your account before logging in.',
            requires_verification: true
          }, status: :created
        else
          Rails.logger.warn "Registration failed for #{user.email}: #{user.errors.full_messages.join(', ')}"
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # POST /web/api/auth/login
      def login
        user = User.find_by(email: login_params[:email])

        # Check if account is locked
        if user&.access_locked?
          return render json: { error: 'Your account has been locked due to too many failed login attempts. Please check your email for unlock instructions.' }, status: :forbidden
        end

        if user&.authenticate(login_params[:password])
          # Block login if email not verified
          unless user.email_verified?
            return render json: {
              error: 'Please verify your email address before logging in. Check your inbox for the verification link.',
              requires_verification: true
            }, status: :forbidden
          end

          user.reset_failed_attempts!
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
          # Register failed attempt if user exists
          if user
            attempts = user.register_failed_attempt!
            if user.access_locked?
              # Send unlock email
              saved_user = user
              ActiveRecord.after_all_transactions_commit do
                ::UserMailer.unlock_account_email(saved_user).deliver_later
              end
              return render json: { error: 'Your account has been locked due to too many failed login attempts. An unlock email has been sent.' }, status: :forbidden
            end
            remaining = User::MAX_FAILED_ATTEMPTS - attempts
            return render json: { error: "Invalid email or password. #{remaining} attempt(s) remaining before account lock." }, status: :unauthorized
          end
          render json: { error: 'Invalid email or password' }, status: :unauthorized
        end
      end

      # GET /web/api/auth/google (redirect to OAuth via POST form)
      def google
        render html: <<~HTML.html_safe, layout: false, content_type: 'text/html'
          <form id="oauth-form" action="/auth/google_oauth2" method="post">
            <input type="hidden" name="authenticity_token" value="#{form_authenticity_token}">
          </form>
          <script>document.getElementById('oauth-form').submit();</script>
        HTML
      end

      # GET /web/api/auth/google/callback
      def google_callback
        auth = request.env['omniauth.auth']
        user = User.find_for_oauth(auth)

        if user.persisted?
          user.update(last_login_at: Time.current)
          token = user.generate_jwt
          redirect_to_frontend "/auth/callback?auth_token=#{token}"
        else
          Rails.logger.error "Google OAuth Persistence Error: #{user.errors.full_messages.join(', ')}"
          redirect_to_frontend "/login?error=registration_failed&message=#{CGI.escape(user.errors.full_messages.first)}"
        end
      rescue StandardError => e
        Rails.logger.error "Google OAuth Callback Error: #{e.message}"
        redirect_to_frontend '/login?error=oauth_failed'
      end

      # GET /web/api/auth/twitter (redirect to OAuth via POST form)
      def twitter
        render html: <<~HTML.html_safe, layout: false, content_type: 'text/html'
          <form id="oauth-form" action="/auth/twitter2" method="post">
            <input type="hidden" name="authenticity_token" value="#{form_authenticity_token}">
          </form>
          <script>document.getElementById('oauth-form').submit();</script>
        HTML
      end

      # GET /web/api/auth/twitter/callback
      def twitter_callback
        auth = request.env['omniauth.auth']
        user = User.find_for_oauth(auth)

        if user.persisted?
          user.update(last_login_at: Time.current)
          token = user.generate_jwt
          redirect_to_frontend "/auth/callback?auth_token=#{token}"
        else
          Rails.logger.error "Twitter OAuth Persistence Error: #{user.errors.full_messages.join(', ')}"
          redirect_to_frontend "/login?error=registration_failed&message=#{CGI.escape(user.errors.full_messages.first)}"
        end
      rescue StandardError => e
        Rails.logger.error "Twitter OAuth Callback Error: #{e.message}"
        redirect_to_frontend '/login?error=oauth_failed'
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
        permitted = params.permit(:username, :first_name, :last_name, :country, :country_code, :city, :phone, :profile_picture_url, :avatar)

        # Check username uniqueness if changed
        if permitted[:username].present? && permitted[:username] != current_user.username && User.where(
          'LOWER(username) = ? AND id != ?', permitted[:username].downcase, current_user.id
        ).exists?
          return render json: { error: 'Username is already taken' }, status: :unprocessable_entity
        end

        if current_user.update(permitted)
          if current_user.avatar.attached?
            # Store the stable proxy path directly in the database
            proxy_path = Rails.application.routes.url_helpers.rails_storage_proxy_path(current_user.avatar, only_path: true)
            current_user.update_column(:profile_picture_url, proxy_path)
          end
          render json: { message: 'Profile updated successfully', user: serialize_user(current_user) }
        else
          render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # POST /web/api/auth/change_password
      def change_password
        actor = current_user || current_reseller
        unless actor
          return render json: { error: 'Unauthorized' }, status: :unauthorized
        end

        unless actor.authenticate(params[:current_password])
          return render json: { error: 'Current password is incorrect' }, status: :unprocessable_entity
        end

        if params[:new_password].blank? || params[:new_password].length < 8
          return render json: { error: 'New password must be at least 8 characters' }, status: :unprocessable_entity
        end

        if params[:new_password] != params[:password_confirmation]
          return render json: { error: 'Password confirmation does not match' }, status: :unprocessable_entity
        end

        if actor.update(password: params[:new_password], password_confirmation: params[:password_confirmation])
          render json: { message: 'Password changed successfully' }
        else
          render json: { errors: actor.errors.full_messages }, status: :unprocessable_entity
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
        # Try User first, then Reseller
        user = User.find_by(email_confirmation_token: params[:token])
        if user
          # Check 30-minute expiry using updated_at (token was set at creation or resend)
          if user.email_verified_at.present?
            token = user.generate_jwt
            redirect_to_frontend "/auth/callback?auth_token=#{token}&message=already_confirmed"
          else
            user.update!(email_verified_at: Time.current, email_confirmation_token: nil)
            token = user.generate_jwt
            redirect_to_frontend "/auth/callback?auth_token=#{token}&message=confirmed"
          end
          return
        end

        # Check Reseller
        reseller = Reseller.find_by(email_confirmation_token: params[:token])
        if reseller
          if reseller.email_verified?
            redirect_to_frontend "/reseller/login?message=already_confirmed"
          else
            reseller.confirm_email!
            redirect_to_frontend "/reseller/login?message=confirmed"
          end
          return
        end

        redirect_to_frontend '/login?error=invalid_token'
      end

      # POST /web/api/auth/resend_confirmation
      def resend_confirmation
        email = params[:email]
        account_type = params[:account_type] || 'user'

        if account_type == 'reseller'
          reseller = Reseller.find_by(email: email)
          if reseller.nil?
            render json: { message: 'If an account with that email exists, a confirmation email has been sent.' }
          elsif reseller.email_verified?
            render json: { message: 'Email is already confirmed.' }
          else
            reseller.generate_confirmation_token!
            saved = reseller
            ActiveRecord.after_all_transactions_commit do
              ::UserMailer.confirmation_email(saved).deliver_later
            end
            render json: { message: 'Verification email resent! Check your inbox.' }
          end
        else
          user = User.find_by(email: email)
          if user.nil?
            render json: { message: 'If an account with that email exists, a confirmation email has been sent.' }
          elsif user.email_verified_at.present?
            render json: { message: 'Email is already confirmed.' }
          else
            user.update!(email_confirmation_token: SecureRandom.urlsafe_base64(32))
            saved_user = user
            ActiveRecord.after_all_transactions_commit do
              ::UserMailer.confirmation_email(saved_user).deliver_later
            end
            render json: { message: 'Verification email resent! Check your inbox.' }
          end
        end
      end

      # POST /web/api/auth/forgot_password
      def forgot_password
        account_type = params[:account_type] || 'user'

        if account_type == 'reseller'
          reseller = Reseller.find_by(email: params[:email])
          if reseller
            # Require email verification before allowing password reset
            unless reseller.email_verified?
              return render json: { error: 'Please verify your email address first before requesting a password reset.' }, status: :unprocessable_entity
            end

            reseller.generate_password_reset_token!
            saved = reseller
            ActiveRecord.after_all_transactions_commit do
              ::UserMailer.password_reset_email(saved).deliver_later
            end
          end
        else
          user = User.find_by(email: params[:email])
          if user
            # Require email verification before allowing password reset
            unless user.email_verified?
              return render json: { error: 'Please verify your email address first before requesting a password reset.' }, status: :unprocessable_entity
            end

            user.update!(
              password_reset_token: SecureRandom.urlsafe_base64(32),
              password_reset_sent_at: Time.current
            )
            saved_user = user
            ActiveRecord.after_all_transactions_commit do
              ::UserMailer.password_reset_email(saved_user).deliver_later
            end
          end
        end

        render json: { message: 'If an account with that email exists, password reset instructions have been sent.' }
      end

      # POST /web/api/auth/reset_password
      def reset_password
        # Try User first, then Reseller
        user = User.find_by(password_reset_token: params[:token])
        if user
          if user.password_reset_sent_at < 30.minutes.ago
            return render json: { error: 'Reset token has expired. Please request a new one.' }, status: :unprocessable_entity
          end
          return process_password_reset(user)
        end

        reseller = Reseller.find_by(password_reset_token: params[:token])
        if reseller
          if reseller.password_reset_sent_at < 30.minutes.ago
            return render json: { error: 'Reset token has expired. Please request a new one.' }, status: :unprocessable_entity
          end
          return process_password_reset(reseller)
        end

        render json: { error: 'Invalid or expired reset token' }, status: :unprocessable_entity
      end

      # GET /web/api/auth/unlock_account?token=xxx
      def unlock_account
        # Try User first, then Reseller
        user = User.find_by(unlock_token: params[:token])
        if user
          user.unlock_access!
          return redirect_to_frontend "/login?message=unlocked"
        end

        reseller = Reseller.find_by(unlock_token: params[:token])
        if reseller
          reseller.unlock_access!
          return redirect_to_frontend "/reseller/login?message=unlocked"
        end

        redirect_to_frontend '/login?error=invalid_token'
      end

      private

      def process_password_reset(account)
        if params[:password].blank? || params[:password].length < 8
          return render json: { error: 'Password must be at least 8 characters' }, status: :unprocessable_entity
        end

        if params[:password] != params[:password_confirmation]
          return render json: { error: 'Password confirmation does not match' }, status: :unprocessable_entity
        end

        if account.is_a?(Reseller)
          account.update!(
            password: params[:password],
            password_confirmation: params[:password_confirmation]
          )
          account.clear_password_reset!
        else
          account.update!(
            password: params[:password],
            password_confirmation: params[:password_confirmation],
            password_reset_token: nil,
            password_reset_sent_at: nil
          )
        end

        render json: { message: 'Password has been reset successfully. You can now log in.' }
      end

      def register_params
        params.require(:user).permit(:email, :password, :password_confirmation, :first_name, :last_name, :phone,
                                     :country, :country_code, :city, :username, :profile_picture_url, :avatar)
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

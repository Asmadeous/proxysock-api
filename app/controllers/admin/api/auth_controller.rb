# frozen_string_literal: true

module Admin
  module Api
    class AuthController < ActionController::Base
      include JwtAuthenticated
      include ErrorHandling
      # Skip forgery protection for API requests because of origin mismatch between domains
      protect_from_forgery with: :null_session, unless: -> { request.format.json? || request.headers['Authorization'].present? }
      skip_forgery_protection if: -> { request.format.json? }


      skip_before_action :authenticate_request, only: %i[zoho zoho_callback login failure]
      # GET /admin/api/auth/zoho (redirect to OAuth)
      # GET /admin/api/auth/zoho (redirect to OAuth via POST form)
      def zoho
        render html: <<~HTML.html_safe, layout: false, content_type: 'text/html'
          <form id="oauth-form" action="/auth/zoho" method="post">
            <input type="hidden" name="authenticity_token" value="#{form_authenticity_token}">
          </form>
          <script>document.getElementById('oauth-form').submit();</script>
        HTML
      end

      # GET /admin/api/auth/zoho/callback
      def zoho_callback
        auth = request.env['omniauth.auth']

        begin
          employee = Employee.from_omniauth(auth)

          if employee.persisted?
            employee.update(last_login_at: Time.current)
            token = employee.generate_jwt
            redirect_to_frontend "/auth/callback?auth_token=#{token}&target=/admin"
          else
            Rails.logger.error "Zoho Auth Persistence Error: #{employee.errors.full_messages.join(', ')}"
            redirect_to_frontend "/admin/login?error=registration_failed&message=#{CGI.escape(employee.errors.full_messages.first)}"
          end
        rescue SecurityError => e
          redirect_to_frontend "/admin/login?error=#{CGI.escape(e.message)}"
        rescue StandardError => e
          Rails.logger.error "Zoho Auth Error: #{e.message}"
          redirect_to_frontend '/admin/login?error=auth_failed'
        end
      end

      # POST /admin/api/auth/login — direct email/password login for employees
      def login
        employee = Employee.find_by(email: params[:email])

        unless employee&.authenticate(params[:password])
          return render json: { error: 'Invalid email or password' }, status: :unauthorized
        end

        return render json: { error: 'Account is deactivated' }, status: :forbidden unless employee.active?

        employee.update_columns(last_login_at: Time.current)
        token = employee.generate_jwt

        render json: {
          message: 'Login successful',
          employee: serialize_employee(employee),
          token: token,
          role: employee.role
        }
      end

      # OAuth failure callback
      def failure
        render json: { error: params[:message] || 'Authentication failed' }, status: :unauthorized
      end

      private

      def serialize_employee(employee)
        {
          id: employee.id,
          email: employee.email,
          first_name: employee.first_name,
          last_name: employee.last_name,
          role: employee.role,
          department: employee.department&.name,
          profile_picture_url: employee.avatar.attached? ? Rails.application.routes.url_helpers.rails_storage_proxy_path(employee.avatar, only_path: true) : employee.profile_picture_url
        }
      end
    end
  end
end

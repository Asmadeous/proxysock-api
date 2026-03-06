# frozen_string_literal: true

module Admin
  module Api
    class AuthController < ApplicationController
      # GET /admin/api/auth/zoho (redirect to OAuth)
      def zoho
        redirect_to '/auth/zoho_oauth2', allow_other_host: true
      end

      # GET /admin/api/auth/zoho/callback
      def zoho_callback
        auth = request.env['omniauth.auth']

        begin
          employee = Employee.from_omniauth(auth)

          employee.update(last_login_at: Time.current)
          token = employee.generate_jwt

          render json: {
            message: 'Zoho login successful',
            employee: serialize_employee(employee),
            token: token
          }
        rescue SecurityError => e
          render json: { error: e.message }, status: :forbidden
        rescue StandardError => e
          render json: { error: "Zoho Authentication failed: #{e.message}" }, status: :unprocessable_entity
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
          profile_picture_url: employee.profile_picture_url
        }
      end
    end
  end
end

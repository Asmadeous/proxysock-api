module Admin
  module Api
    class AuthController < ApplicationController
      skip_before_action :verify_authenticity_token, raise: false

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
        rescue => e
          render json: { error: "Zoho Authentication failed: #{e.message}" }, status: :unprocessable_entity
        end
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
          department: employee.department&.name
        }
      end
    end
  end
end

module Api
  module V1
    class AuthController < ApplicationController
      
      # POST /api/v1/auth/token
      # Issue initial rotating token for reseller
      def token
        reseller = authenticate_reseller_credentials
        
        if reseller
          token = reseller.generate_rotating_token
          
          render json: {
            message: 'Token issued successfully',
            token: token,
            reseller_id: reseller.id,
            expires_in: 3600, # 1 hour
            note: 'This token is single-use. Each API response includes X-Next-Token header with your next token.'
          }
        else
          render json: { error: 'Invalid credentials' }, status: :unauthorized
        end
      end
      
      # POST /api/v1/auth/refresh
      # Manually request new token (if needed)
      def refresh
        header = request.headers['Authorization']
        token = header&.split(' ')&.last
        
        return render json: { error: 'Missing authorization' }, status: :unauthorized unless token
        
        begin
          decoded = JWT.decode(token, Rails.application.secret_key_base, true, algorithm: 'HS256')[0]
          reseller = Reseller.find(decoded['reseller_id'])
          
          # Generate fresh token
          new_token = reseller.generate_rotating_token
          
          render json: {
            message: 'Token refreshed',
            token: new_token,
            expires_in: 3600
          }
        rescue JWT::ExpiredSignature
          render json: { error: 'Token expired. Please authenticate again.' }, status: :unauthorized
        rescue => e
          render json: { error: "Refresh failed: #{e.message}" }, status: :unauthorized
        end
      end
      
      private
      
      def authenticate_reseller_credentials
        email = params[:email] || params.dig(:reseller, :email)
        password = params[:password] || params.dig(:reseller, :password)
        
        reseller = Reseller.find_by(email: email)
        reseller if reseller&.authenticate(password)
      end
    end
  end
end

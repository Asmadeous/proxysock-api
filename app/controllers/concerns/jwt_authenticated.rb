module JwtAuthenticated
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_request
    attr_reader :current_reseller, :current_user
  end

  private

  def authenticate_request
    header = request.headers['Authorization']
    header = header.split(' ').last if header
    begin
      decoded = jwt_decode(header)
      if decoded[:reseller_id]
        @current_reseller = Reseller.find(decoded[:reseller_id])
      elsif decoded[:user_id]
        @current_user = User.find(decoded[:user_id])
      end
    rescue ActiveRecord::RecordNotFound, JWT::DecodeError
      render json: { errors: 'Unauthorized' }, status: :unauthorized
    end
  end
  
  def jwt_decode(token)
    decoded = JWT.decode(token, Rails.application.secret_key_base)[0]
    HashWithIndifferentAccess.new decoded
  end
end

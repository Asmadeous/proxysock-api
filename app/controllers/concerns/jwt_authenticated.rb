# frozen_string_literal: true

module JwtAuthenticated
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_request
    attr_reader :current_reseller, :current_user, :current_employee, :decoded_token
  end

  private

  def authenticate_request
    header = request.headers['Authorization']
    token = header&.split(' ')&.last
    return render_unauthorized('Missing authorization header') unless token

    if token.start_with?('ps_live_')
      return authenticate_dedicated_api_key(token)
    end

    begin

      @decoded_token = jwt_decode(token)

      if @decoded_token[:reseller_id] && @decoded_token[:jti]
        authenticate_reseller_with_rotation
      elsif @decoded_token[:reseller_id]
        @current_reseller = Reseller.find(@decoded_token[:reseller_id])
      elsif @decoded_token[:user_id]
        @current_user = User.find(@decoded_token[:user_id])
      elsif @decoded_token[:employee_id]
        @current_employee = Employee.find(@decoded_token[:employee_id])
      else
        render_unauthorized('Invalid token payload')
      end
    rescue ActiveRecord::RecordNotFound
      render_unauthorized('Account not found')
    rescue JWT::ExpiredSignature
      render_unauthorized('Token has expired')
    rescue JWT::DecodeError => e
      render_unauthorized("Invalid token: #{e.message}")
    end
  end

  # Reseller uses rotating tokens - validate and issue new one
  def authenticate_reseller_with_rotation
    jti = @decoded_token[:jti]
    @current_reseller = Reseller.find(@decoded_token[:reseller_id])

    unless @current_reseller.validate_and_consume_token!(jti)
      render_unauthorized('Token already used or invalid. Request a new token.')
      return
    end

    # Generate new token for next request
    @next_token = @current_reseller.generate_rotating_token

    # Set header with new token
    response.set_header('X-Next-Token', @next_token)
  end

  def authenticate_dedicated_api_key(key)
    @current_reseller = Reseller.find_by(dedicated_api_key: key)
    
    if @current_reseller
      @decoded_token = { reseller_id: @current_reseller.id, type: 'dedicated' }
    else
      render_unauthorized('Invalid dedicated API key')
    end
  end


  def jwt_decode(token)
    decoded = JWT.decode(token, Rails.application.secret_key_base, true, algorithm: 'HS256')[0]
    HashWithIndifferentAccess.new(decoded)
  end

  def render_unauthorized(message = 'Unauthorized')
    render json: { error: message }, status: :unauthorized
  end

  # Helper to check if current actor is a reseller
  def reseller_authenticated?
    @current_reseller.present?
  end

  # Helper to check if current actor is a user
  def user_authenticated?
    @current_user.present?
  end

  # Helper to check if current actor is an employee
  def employee_authenticated?
    @current_employee.present?
  end
end

module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user, :current_reseller, :current_employee, :guest_session_id

    def connect
      self.current_user = find_verified_user
      self.current_reseller = find_verified_reseller
      self.current_employee = find_verified_employee
      self.guest_session_id = request.params[:guest_token] # Extracted from Websocket URL query params
      
      reject_unauthorized_connection unless current_user || current_reseller || current_employee || guest_session_id
    end

    private

    def find_verified_user
      decoded = decode_token
      if decoded && decoded['user_id']
        User.find_by(id: decoded['user_id'])
      end
    rescue
      nil
    end

    def find_verified_reseller
      decoded = decode_token
      if decoded && decoded['reseller_id']
        Reseller.find_by(id: decoded['reseller_id'])
      end
    rescue
      nil
    end
    
    def find_verified_employee
       decoded = decode_token
       if decoded && decoded['employee_id']
         Employee.find_by(id: decoded['employee_id'])
       end
    rescue
      nil
    end

    def decode_token
      token = request.params[:token]
      return nil unless token
      JWT.decode(token, Rails.application.secret_key_base, true, algorithm: 'HS256')[0]
    rescue
      nil
    end
  end
end

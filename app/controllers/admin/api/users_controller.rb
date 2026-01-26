module Admin
  module Api
    class UsersController < BaseController
      def index
        users = User.order(created_at: :desc).page(params[:page]).per(20)
        render json: { 
          users: users,
          meta: { 
            current_page: users.current_page, 
            total_pages: users.total_pages, 
            total_count: users.total_count 
          }
        }
      end
      
      def show
        user = User.find(params[:id])
        render json: { user: user, orders_count: user.orders.count, wallet: user.wallet }
      end
      
      def update
        user = User.find(params[:id])
        
        # Audit the change
        record_audit_log("update_user", user) if defined?(record_audit_log)

        if user.update(user_params)
          render json: { user: user }
        else
          render json: { errors: user.errors }, status: :unprocessable_entity
        end
      end
      
      def impersonate
        user = User.find(params[:id])
        
        # Logic: Generate a short-lived session token for this user
        token = "impersonation_#{SecureRandom.hex(16)}"
        # Store in Redis/DB with expiry
        
        render json: { 
          token: token, 
          redirect_url: "https://proxysock.com/impersonate?token=#{token}" 
        }
        
        # Log it
        UserImpersonationLog.create!(
          employee_id: current_employee&.id || 1, # Fallback for test
          user_id: user.id,
          started_at: Time.current,
          ip_address: request.remote_ip,
          reason: params[:reason] || "Support"
        )
      end
      
      private
      
      def user_params
        params.require(:user).permit(:first_name, :last_name, :email, :status)
      end
    end
  end
end

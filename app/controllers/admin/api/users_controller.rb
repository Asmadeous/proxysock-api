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
        if user.update(user_params)
          render json: { user: user }
        else
          render json: { errors: user.errors }, status: :unprocessable_entity
        end
      end
      
      private
      
      def user_params
        params.require(:user).permit(:first_name, :last_name, :email, :status)
      end
    end
  end
end

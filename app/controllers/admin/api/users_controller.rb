module Admin
  module Api
    class UsersController < ApplicationController
      before_action :authenticate_admin!
      before_action :set_user, only: [:show, :update, :destroy]

      # GET /admin/api/users
      def index
        users = User.order(created_at: :desc).page(params[:page])
        render json: {
          users: users.map { |u| serialize_user(u) },
          meta: pagination_meta(users)
        }
      end

      # GET /admin/api/users/:id
      def show
        render json: serialize_user(@user)
      end

      # POST /admin/api/users
      def create
        @user = User.new(user_params)
        
        if @user.save
          @user.create_wallet!
          render json: serialize_user(@user), status: :created
        else
          render json: { errors: @user.errors }, status: :unprocessable_entity
        end
      end

      # PATCH /admin/api/users/:id
      def update
        if @user.update(user_params)
          render json: serialize_user(@user)
        else
          render json: { errors: @user.errors }, status: :unprocessable_entity
        end
      end

      # DELETE /admin/api/users/:id
      def destroy
        @user.destroy
        head :no_content
      end

      private

      def set_user
        @user = User.find(params[:id])
      end

      def user_params
        params.require(:user).permit(:email, :first_name, :last_name, :password, :password_confirmation, :status)
      end

      def serialize_user(user)
        {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          balance: user.wallet&.balance || 0.0,
          status: user.status,
          created_at: user.created_at
        }
      end

      def pagination_meta(collection)
        {
          current_page: collection.current_page,
          total_pages: collection.total_pages,
          total_count: collection.total_count
        }
      end

      def authenticate_admin!
        token = request.headers['Authorization']&.split(' ')&.last
        return render json: { error: 'Unauthorized' }, status: :unauthorized unless token

        begin
          payload = JWT.decode(token, Rails.application.secret_key_base).first
          @current_employee = Employee.find(payload['employee_id'])
        rescue
          render json: { error: 'Unauthorized' }, status: :unauthorized
        end
      end
    end
  end
end

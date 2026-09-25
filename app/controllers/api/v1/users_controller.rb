# frozen_string_literal: true

module Api
  module V1
    # Users controller for infrastructure resellers to manage their end-users.
    # Strict data isolation: resellers can ONLY see/manage users they created.
    class UsersController < BaseController
      include JwtAuthenticated

      before_action :set_user, only: %i[show update destroy orders transactions]

      # GET /api/v1/users
      def index
        users = current_reseller.managed_users.order(created_at: :desc)
        users = users.where('email ILIKE :q OR username ILIKE :q OR first_name ILIKE :q', q: "%#{params[:q]}%") if params[:q].present?

        paginated = users.page(params[:page]).per(20)

        render json: {
          users: paginated.map { |u| serialize_user(u) },
          meta: pagination_meta(paginated)
        }
      end

      # POST /api/v1/users
      def create
        user = User.new(user_params)
        user.reseller_id = current_reseller.id
        user.owner_type = 'reseller_managed'
        user.password = params[:password] || SecureRandom.hex(8)
        user.status = 'active'

        if user.save
          # Create wallet for the managed user
          user.initialize_wallet
          render json: serialize_user(user), status: :created
        else
          render json: { errors: user.errors }, status: :unprocessable_entity
        end
      end

      # GET /api/v1/users/:id
      def show
        render json: serialize_user(@user)
      end

      # PATCH /api/v1/users/:id
      def update
        if @user.update(user_update_params)
          render json: serialize_user(@user)
        else
          render json: { errors: @user.errors }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/users/:id
      def destroy
        @user.destroy!
        render json: { message: 'User deleted' }
      end

      # GET /api/v1/users/:id/orders
      # Shows orders placed by this managed user
      def orders
        orders = @user.orders
                      .includes(:product)
                      .order(created_at: :desc)
                      .page(params[:page]).per(20)

        render json: {
          orders: orders.map { |o| serialize_order(o) },
          meta: pagination_meta(orders)
        }
      end

      # GET /api/v1/users/:id/transactions
      # Shows wallet transactions for this managed user
      def transactions
        wallet = @user.main_wallet
        return render json: { transactions: [] } unless wallet

        txns = wallet.wallet_transactions
                     .order(created_at: :desc)
                     .page(params[:page]).per(20)

        render json: {
          transactions: txns,
          meta: pagination_meta(txns)
        }
      end

      private

      # Strict scoping: only find users that belong to THIS reseller
      def set_user
        @user = current_reseller.managed_users.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'User not found' }, status: :not_found
      end

      def user_params
        params.require(:user).permit(:email, :username, :password, :first_name, :last_name, :phone, :country, :city, :country_code)
      end

      def user_update_params
        params.require(:user).permit(:email, :username, :password, :first_name, :last_name, :phone, :status, :country, :city, :country_code)
      end

      def serialize_user(user)
        {
          id: user.id,
          email: user.email,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          status: user.status,
          country: user.country,
          city: user.city,
          country_code: user.country_code,
          balance: user.main_wallet&.balance.to_f,
          created_at: user.created_at
        }
      end

      def serialize_order(order)
        {
          id: order.id,
          order_number: order.order_number,
          product_name: order.product_display_name,
          product_type: order.product&.product_type,
          quantity: order.quantity,
          total_amount: order.total_amount,
          status: order.status,
          created_at: order.created_at
        }
      end

      def pagination_meta(collection)
        {
          current_page: collection.current_page,
          total_pages: collection.total_pages,
          total_count: collection.total_count
        }
      end
    end
  end
end

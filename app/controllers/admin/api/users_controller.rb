# frozen_string_literal: true

module Admin
  module Api
    class UsersController < Admin::Api::BaseController
      before_action :set_user, only: %i[show update destroy onboard impersonate]

      # GET /admin/api/users
      def index
        users = User.order(created_at: :desc)
        if params[:q].present?
          users = users.where('email ILIKE :q OR first_name ILIKE :q OR last_name ILIKE :q',
                              q: "%#{params[:q]}%")
        end

        # Pagination
        page = (params[:page] || 1).to_i
        per  = (params[:per] || 25).to_i
        total = users.count
        users = users.offset((page - 1) * per).limit(per)

        render json: {
          users: users.map { |u| user_json(u) },
          total: total,
          page: page,
          per: per
        }
      end

      # GET /admin/api/users/:id
      def show
        render json: user_json(@user, full: true)
      end

      # PATCH /admin/api/users/:id
      def update
        @user.update!(user_params)
        record_audit_log('user.updated', @user)
        render json: user_json(@user)
      end

      # DELETE /admin/api/users/:id
      def destroy
        require_admin!
        @user.destroy!
        record_audit_log('user.deleted', @user)
        render json: { message: 'User deleted' }
      end

      # POST /admin/api/users/:id/onboard
      def onboard
        require_admin!
        @user.update!(status: 'active', email_verified_at: Time.current)
        @user.create_wallet! unless @user.wallet
        record_audit_log('user.onboarded', @user)
        render json: { message: 'User onboarded', user: user_json(@user) }
      end

      # POST /admin/api/users/:id/impersonate
      def impersonate
        require_admin!
        token = @user.generate_jwt
        UserImpersonationLog.create!(
          employee: current_employee,
          user: @user,
          ip_address: request.remote_ip
        )
        record_audit_log('user.impersonated', @user)
        render json: { token: token, user: user_json(@user) }
      end

      private

      def set_user
        @user = User.find(params[:id])
      end

      def user_params
        params.permit(:first_name, :last_name, :email, :status)
      end

      def user_json(u, full: false)
        data = {
          id: u.id,
          email: u.email,
          first_name: u.first_name,
          last_name: u.last_name,
          status: u.status,
          created_at: u.created_at,
          wallet_balance: u.wallet&.balance || 0,
          total_orders: u.orders.count,
          referred_by: u.referred_by_code,
          has_affiliate: u.affiliate.present?
        }
        if full
          data[:orders] = u.orders.order(created_at: :desc).limit(10).map do |o|
            { id: o.id, product: o.product&.name, status: o.status, total: o.total_amount, created_at: o.created_at }
          end
          data[:tickets] = u.tickets.order(created_at: :desc).limit(5).map do |t|
            { id: t.id, subject: t.subject, status: t.status, created_at: t.created_at }
          end
        end
        data
      end
    end
  end
end

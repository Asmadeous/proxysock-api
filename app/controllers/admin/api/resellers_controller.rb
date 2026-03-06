# frozen_string_literal: true

module Admin
  module Api
    class ResellersController < Admin::Api::BaseController
      before_action :set_reseller, only: %i[show update destroy onboard configure]

      # GET /admin/api/resellers
      def index
        resellers = Reseller.order(created_at: :desc)
        if params[:q].present?
          resellers = resellers.where('email ILIKE :q OR username ILIKE :q OR company_name ILIKE :q',
                                      q: "%#{params[:q]}%")
        end
        resellers = resellers.where(reseller_type: params[:type]) if params[:type].present?
        if params[:status] == 'active'
          resellers = resellers.where('subscription_expires_at > ?', Time.current)
        elsif params[:status] == 'expired'
          resellers = resellers.where('subscription_expires_at <= ? OR subscription_expires_at IS NULL', Time.current)
        end

        page = (params[:page] || 1).to_i
        per  = (params[:per] || 25).to_i
        total = resellers.count
        resellers = resellers.offset((page - 1) * per).limit(per)

        render json: {
          resellers: resellers.map { |r| reseller_json(r) },
          total: total,
          page: page,
          stats: {
            total: Reseller.count,
            api_only: Reseller.where(reseller_type: 'api_only').count,
            enterprise: Reseller.where(reseller_type: 'infrastructure').count,
            total_balance: WalletTransaction.joins(:wallet)
                           .where(wallets: { owner_type: 'Reseller', wallet_type: 'main' })
                           .sum(:amount).to_f
          }
        }
      end

      # GET /admin/api/resellers/:id
      def show
        render json: reseller_json(@reseller, full: true)
      end

      # POST /admin/api/resellers — onboard new reseller
      def create
        require_admin!
        reseller = Reseller.create!(reseller_create_params)
        reseller.create_main_wallet!(wallet_type: 'main')
        reseller.create_earnings_wallet!(wallet_type: 'earnings') if reseller.infrastructure?
        record_audit_log('reseller.created', reseller)
        render json: reseller_json(reseller), status: :created
      end

      # PATCH /admin/api/resellers/:id
      def update
        @reseller.update!(reseller_params)
        record_audit_log('reseller.updated', @reseller)
        render json: reseller_json(@reseller)
      end

      # DELETE /admin/api/resellers/:id
      def destroy
        require_admin!
        @reseller.destroy!
        record_audit_log('reseller.deleted', @reseller)
        render json: { message: 'Reseller deleted' }
      end

      # POST /admin/api/resellers/:id/onboard
      def onboard
        require_admin!
        @reseller.create_main_wallet!(wallet_type: 'main') unless @reseller.main_wallet
        if @reseller.infrastructure? && !@reseller.earnings_wallet
          @reseller.create_earnings_wallet!(wallet_type: 'earnings')
        end
        @reseller.generate_dedicated_api_key if @reseller.infrastructure? && @reseller.dedicated_api_key.blank?
        @reseller.save! if @reseller.changed?
        credentials = @reseller.api_credentials
        record_audit_log('reseller.onboarded', @reseller)
        render json: {
          message: 'Reseller onboarded',
          reseller: reseller_json(@reseller),
          credentials: credentials
        }
      end

      # PATCH /admin/api/resellers/:id/configure
      def configure
        require_role!('admin', 'manager')
        updates = {}
        updates[:reseller_type] = params[:reseller_type] if params[:reseller_type].present?
        updates[:infrastructure_surcharge_percentage] = params[:surcharge].to_d if params[:surcharge].present?
        updates[:subscription_fee] = params[:subscription_fee].to_d if params[:subscription_fee].present?
        if params[:subscription_expires_at].present?
          updates[:subscription_expires_at] =
            params[:subscription_expires_at]
        end
        updates[:dedicated_api_key] = params[:dedicated_api_key] if params.key?(:dedicated_api_key)
        updates[:customer_email] = params[:customer_email] if params.key?(:customer_email)
        @reseller.update!(updates) if updates.any?
        record_audit_log('reseller.configured', @reseller)
        render json: reseller_json(@reseller)
      end

      private

      def set_reseller
        @reseller = Reseller.find(params[:id])
      end

      def reseller_params
        params.permit(:email, :username, :company_name, :reseller_type, :infrastructure_surcharge_percentage,
                      :subscription_fee, :dedicated_api_key, :customer_email)
      end

      def reseller_create_params
        params.permit(:email, :username, :company_name, :password, :reseller_type, :subscription_fee)
      end

      def reseller_json(r, full: false)
        data = {
          id: r.id,
          email: r.email,
          username: r.username,
          company_name: r.company_name,
          reseller_type: r.reseller_type,
          balance: r.balance || 0,
          earnings_balance: r.earnings_balance || 0,
          surcharge: r.infrastructure_surcharge_percentage,
          subscription_fee: r.subscription_fee,
          subscription_expires_at: r.subscription_expires_at,
          dedicated_api_key: r.dedicated_api_key,
          customer_email: r.customer_email,
          total_orders: r.orders.count,
          has_affiliate: r.affiliate.present?,
          created_at: r.created_at
        }
        if full
          data[:orders] = r.orders.order(created_at: :desc).limit(20).map do |o|
            { id: o.id, product: o.product&.name, status: o.status, total: o.total_amount, created_at: o.created_at }
          end
          data[:webhooks] = r.webhook_endpoints.map do |w|
            { id: w.id, url: w.url, events: w.events, created_at: w.created_at }
          end
          data[:api_tokens] = r.api_tokens.map { |t| { id: t.id, name: t.name, created_at: t.created_at } }
        end
        data
      end
    end
  end
end

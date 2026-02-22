# frozen_string_literal: true

module Admin
  module Api
    class ResellersController < Admin::Api::BaseController
      before_action :set_reseller, only: %i[show update destroy onboard configure]

      # GET /admin/api/resellers
      def index
        resellers = Reseller.order(created_at: :desc)
        resellers = resellers.where("email ILIKE :q OR username ILIKE :q OR company_name ILIKE :q", q: "%#{params[:q]}%") if params[:q].present?
        resellers = resellers.where(reseller_type: params[:type]) if params[:type].present?

        page = (params[:page] || 1).to_i
        per  = (params[:per] || 25).to_i
        total = resellers.count
        resellers = resellers.offset((page - 1) * per).limit(per)

        render json: {
          resellers: resellers.map { |r| reseller_json(r) },
          total: total,
          page: page
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
        reseller.create_wallet!
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
        @reseller.create_wallet! unless @reseller.wallet
        credentials = @reseller.generate_initial_credentials
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
        @reseller.update!(
          reseller_type:                    params[:reseller_type] || @reseller.reseller_type,
          infrastructure_surcharge_percentage: params[:surcharge]&.to_d || @reseller.infrastructure_surcharge_percentage
        )
        record_audit_log('reseller.configured', @reseller)
        render json: reseller_json(@reseller)
      end

      private

      def set_reseller
        @reseller = Reseller.find(params[:id])
      end

      def reseller_params
        params.permit(:email, :username, :company_name, :reseller_type, :infrastructure_surcharge_percentage)
      end

      def reseller_create_params
        params.permit(:email, :username, :company_name, :password, :reseller_type)
      end

      def reseller_json(r, full: false)
        data = {
          id:             r.id,
          email:          r.email,
          username:       r.username,
          company_name:   r.company_name,
          reseller_type:  r.reseller_type,
          balance:        r.balance || 0,
          surcharge:      r.infrastructure_surcharge_percentage,
          total_orders:   r.orders.count,
          has_affiliate:  r.affiliate.present?,
          created_at:     r.created_at
        }
        if full
          data[:orders] = r.orders.order(created_at: :desc).limit(10).map do |o|
            { id: o.id, product: o.product&.name, status: o.status, total: o.total_amount, created_at: o.created_at }
          end
          data[:api_tokens] = r.api_tokens.map { |t| { id: t.id, name: t.name, created_at: t.created_at } }
        end
        data
      end
    end
  end
end

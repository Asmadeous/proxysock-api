# frozen_string_literal: true

module Admin
  module Api
    class AffiliatesController < Admin::Api::BaseController
      before_action :set_affiliate, only: %i[show update destroy configure]

      # GET /admin/api/affiliates
      def index
        affiliates = Affiliate.includes(:affiliatable)
                              .order(created_at: :desc)
                              .page(params[:page]).per(25)

        render json: {
          affiliates: affiliates.map { |a| affiliate_json(a) },
          total: affiliates.total_count
        }
      end

      # GET /admin/api/affiliates/:id
      def show
        render json: affiliate_json(@affiliate)
      end

      # PATCH /admin/api/affiliates/:id
      def update
        @affiliate.update!(affiliate_params)
        render json: affiliate_json(@affiliate)
      end

      # DELETE /admin/api/affiliates/:id
      def destroy
        @affiliate.destroy!
        render json: { message: 'Affiliate removed' }
      end

      # PATCH /admin/api/affiliates/:id/configure
      def configure
        @affiliate.update!(commission_rate: params[:commission_rate],
                           discount_rate:   params[:discount_rate],
                           status:          params[:status])
        render json: affiliate_json(@affiliate)
      end

      private

      def set_affiliate
        @affiliate = Affiliate.find(params[:id])
      end

      def affiliate_params
        params.permit(:commission_rate, :discount_rate, :status, :notes)
      end

      def affiliate_json(a)
        entity = a.affiliatable
        {
          id:               a.id,
          referral_code:    a.referral_code,
          status:           a.status,
          commission_rate:  a.commission_rate,
          discount_rate:    a.discount_rate,
          total_earned:     a.total_earned,
          pending_balance:  a.pending_balance,
          total_paid_out:   a.total_paid_out,
          notes:            a.notes,
          affiliatable_type: a.affiliatable_type,
          affiliatable_name: entity.respond_to?(:company_name) ? entity.company_name : "#{entity.first_name} #{entity.last_name}",
          affiliatable_email: entity.email,
          total_referrals:  a.affiliate_referrals.count,
          converted:        a.affiliate_referrals.converted.count,
          created_at:       a.created_at
        }
      end
    end
  end
end

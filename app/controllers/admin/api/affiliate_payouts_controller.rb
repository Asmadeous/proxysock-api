# frozen_string_literal: true

module Admin
  module Api
    class AffiliatePayoutsController < Admin::Api::BaseController
      before_action :set_payout, only: %i[show process_payout]

      # GET /admin/api/affiliate_payouts
      def index
        payouts = AffiliatePayout.includes(affiliate: :affiliatable)
                                 .order(created_at: :desc)
                                 .page(params[:page]).per(25)
        payouts = payouts.where(status: params[:status]) if params[:status].present?

        render json: {
          payouts: payouts.map { |p| payout_json(p) },
          total:   payouts.total_count
        }
      end

      # GET /admin/api/affiliate_payouts/:id
      def show
        render json: payout_json(@payout)
      end

      # PATCH /admin/api/affiliate_payouts/:id/process
      def process_payout
        AffiliateService.process_payout!(@payout)
        render json: { message: 'Payout processed', status: @payout.reload.status }
      rescue => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      private

      def set_payout
        @payout = AffiliatePayout.find(params[:id])
      end

      def payout_json(p)
        entity = p.affiliate.affiliatable
        {
          id:              p.id,
          amount:          p.amount,
          status:          p.status,
          payment_method:  p.payment_method,
          created_at:      p.created_at,
          paid_at:         p.paid_at,
          notes:           p.notes,
          affiliate_code:  p.affiliate.referral_code,
          affiliate_name:  entity.respond_to?(:company_name) ? entity.company_name : "#{entity.first_name} #{entity.last_name}",
          affiliate_email: entity.email
        }
      end
    end
  end
end

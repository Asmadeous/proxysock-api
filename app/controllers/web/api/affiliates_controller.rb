# frozen_string_literal: true

module Web
  module Api
    class AffiliatesController < ApplicationController
      before_action :authenticate_user!

      # GET /web/api/affiliate
      def show
        affiliate = current_entity.affiliate
        return render json: { enrolled: false } unless affiliate

        render json: affiliate_json(affiliate)
      end

      # POST /web/api/affiliate
      # Enrol the current user/reseller in the affiliate program
      def create
        affiliate = AffiliateService.new(current_entity).enrol!
        render json: affiliate_json(affiliate), status: :created
      rescue AffiliateService::AlreadyEnrolledError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # POST /web/api/affiliate/request_payout
      def request_payout
        payout = AffiliateService.new(current_entity).request_payout!(
          amount: payout_params[:amount].to_d,
          method: payout_params[:payment_method] || 'wallet',
          details: payout_params[:payment_details] || {}
        )
        render json: { payout_id: payout.id, status: payout.status }, status: :created
      rescue AffiliateService::InsufficientBalanceError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      private

      def affiliate_json(affiliate)
        referrals = affiliate.affiliate_referrals

        {
          referral_code:     affiliate.referral_code,
          referral_url:      affiliate.referral_url,
          status:            affiliate.status,
          commission_rate:   affiliate.commission_rate,
          discount_rate:     affiliate.discount_rate,
          total_earned:      affiliate.total_earned,
          total_paid_out:    affiliate.total_paid_out,
          pending_balance:   affiliate.pending_balance,
          last_payout_at:    affiliate.last_payout_at,
          total_referrals:   referrals.count,
          converted:         referrals.converted.count,
          pending_referrals: referrals.pending.count,
          payouts:           affiliate.affiliate_payouts.order(created_at: :desc).limit(10).map do |p|
            { id: p.id, amount: p.amount, status: p.status, created_at: p.created_at, paid_at: p.paid_at }
          end
        }
      end

      def payout_params
        params.permit(:amount, :payment_method, payment_details: {})
      end

      def current_entity
        current_user || current_reseller
      end
    end
  end
end

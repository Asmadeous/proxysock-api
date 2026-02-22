# frozen_string_literal: true

module Web
  module Api
    class AffiliateReferralsController < ApplicationController
      before_action :authenticate_user!

      # GET /web/api/affiliate_referrals
      def index
        affiliate = current_entity.affiliate
        return render json: { referrals: [] } unless affiliate

        referrals = affiliate.affiliate_referrals
                             .includes(:referred, :order)
                             .order(created_at: :desc)
                             .page(params[:page])
                             .per(20)

        render json: {
          referrals: referrals.map do |r|
            {
              id:             r.id,
              referred_type:  r.referred_type,
              status:         r.status,
              discount:       r.referee_discount_applied,
              commission:     r.commission_amount,
              converted_at:   r.converted_at,
              created_at:     r.created_at
            }
          end,
          total: referrals.total_count
        }
      end

      private

      def current_entity
        current_user || current_reseller
      end
    end
  end
end

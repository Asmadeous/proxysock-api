# frozen_string_literal: true

module Web
  module Api
    class AffiliatePayoutsController < BaseController
      before_action :authenticate_actor!

      def index
        affiliate = (current_user || current_reseller).affiliate
        return render json: { payouts: [], total: 0 } unless affiliate

        payouts = affiliate.affiliate_payouts.order(created_at: :desc).page(params[:page]).per(20)
        render json: {
          payouts: payouts.map { |payout| serialize_payout(payout) },
          total: payouts.total_count
        }
      end

      private

      def serialize_payout(payout)
        {
          id: payout.id,
          amount: payout.amount,
          status: payout.status,
          payment_method: payout.payment_method,
          created_at: payout.created_at,
          paid_at: payout.paid_at
        }
      end
    end
  end
end

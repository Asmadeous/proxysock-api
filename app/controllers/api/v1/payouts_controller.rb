# frozen_string_literal: true

module Api
  module V1
    # Payouts controller for infrastructure resellers to withdraw earnings.
    # Only infrastructure resellers have earnings wallets and can request payouts.
    class PayoutsController < BaseController
      include JwtAuthenticated

      before_action :require_infrastructure!

      # GET /api/v1/payouts
      def index
        payouts = current_reseller.payouts.order(created_at: :desc)
                                  .page(params[:page]).per(20)

        render json: {
          payouts: payouts.map { |p| serialize_payout(p) },
          meta: pagination_meta(payouts)
        }
      end

      # GET /api/v1/payouts/:id
      def show
        payout = current_reseller.payouts.find(params[:id])
        render json: serialize_payout(payout)
      end

      # POST /api/v1/payouts
      def create
        amount = params[:amount].to_d
        gateway = params[:gateway]
        payment_details = params[:payment_details]&.to_unsafe_h || {}

        payout = PayoutService.new(current_reseller).withdraw!(
          amount: amount,
          gateway: gateway,
          payment_details: payment_details
        )

        render json: {
          message: 'Payout request submitted',
          payout: serialize_payout(payout)
        }, status: :created
      rescue PayoutService::InsufficientBalanceError => e
        render json: { error: e.message }, status: :unprocessable_entity
      rescue PayoutService::InvalidGatewayError => e
        render json: { error: e.message }, status: :bad_request
      rescue PayoutService::PayoutError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      private

      def require_infrastructure!
        return if current_reseller&.infrastructure?

        render json: { error: 'Payouts are only available for infrastructure resellers' }, status: :forbidden
      end

      def serialize_payout(payout)
        {
          id: payout.id,
          amount: payout.amount,
          gateway: payout.gateway,
          status: payout.status,
          reference: payout.reference,
          payment_details: payout.payment_details,
          completed_at: payout.completed_at,
          created_at: payout.created_at
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

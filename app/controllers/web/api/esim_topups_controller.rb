# frozen_string_literal: true

module Web
  module Api
    # Top-ups on the customer's own MeiSIM phone-number lines: a one-time top-up or a
    # monthly auto top-up, paid from the balance and applied by staff.
    class EsimTopupsController < BaseController
      include JwtAuthenticated

      before_action :set_order

      # GET /web/api/orders/:id/topups
      def index
        subscription = @order.esim_topup_subscriptions.live.first
        render json: {
          eligible: EsimTopupService.eligible?(@order),
          one_time_options: EsimTopupService::ONE_TIME_VALUES.map { |v| option_json(v) },
          min_subscription_value: EsimTopupService::MIN_SUBSCRIPTION_VALUE.to_i,
          subscription: subscription && subscription_json(subscription),
          topups: @order.esim_topups.recent_first.limit(20).map { |t| topup_json(t) },
          available_balance: current_actor.wallet&.balance.to_f
        }
      end

      # POST /web/api/orders/:id/topups { value }
      def create
        topup = EsimTopupService.new(@order, current_actor).buy_once!(params.require(:value))
        render json: { topup: topup_json(topup), available_balance: current_actor.wallet&.balance.to_f }, status: :created
      rescue *errors => e
        render json: { error: e.message }, status: error_status(e)
      end

      # POST /web/api/orders/:id/topup_subscription { value }
      def subscribe
        subscription = EsimTopupService.new(@order, current_actor).subscribe!(params.require(:value))
        render json: { subscription: subscription_json(subscription), available_balance: current_actor.wallet&.balance.to_f },
               status: :created
      rescue *errors => e
        render json: { error: e.message }, status: error_status(e)
      end

      # DELETE /web/api/orders/:id/topup_subscription
      def unsubscribe
        subscription = @order.esim_topup_subscriptions.live.first
        return render json: { error: 'No active auto top-up' }, status: :not_found unless subscription

        subscription.cancel!
        render json: { subscription: subscription_json(subscription) }
      end

      private

      def set_order
        @order = current_actor.orders.find(params[:id])
      end

      def errors
        [EsimTopupService::NotEligible, EsimTopupService::InvalidAmount, EsimTopupService::InsufficientBalance]
      end

      def error_status(error)
        error.is_a?(EsimTopupService::InsufficientBalance) ? :payment_required : :unprocessable_entity
      end

      def option_json(value)
        { value: value.to_f, price: EsimTopupService.price_for(value).to_f }
      end

      def topup_json(topup)
        {
          id: topup.id, reference: topup.reference, status: topup.status, topup_value: topup.topup_value.to_f,
          price: topup.price.to_f, auto: topup.esim_topup_subscription_id.present?,
          created_at: topup.created_at, completed_at: topup.completed_at
        }
      end

      def subscription_json(subscription)
        {
          id: subscription.id, status: subscription.status, topup_value: subscription.topup_value.to_f,
          price: subscription.price.to_f, next_charge_at: subscription.next_charge_at,
          last_charged_at: subscription.last_charged_at
        }
      end
    end
  end
end

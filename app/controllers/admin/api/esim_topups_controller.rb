# frozen_string_literal: true

module Admin
  module Api
    # Staff queue of paid eSIM top-ups to apply by hand in the MeiSIM portal.
    class EsimTopupsController < Admin::Api::BaseController
      before_action :set_topup, only: %i[complete cancel]

      # GET /admin/api/esim_topups?status=pending
      def index
        topups = EsimTopup.includes(:orderable, order: [:product, { esim_order: :esims }]).recent_first
                          .page(params[:page]).per(25)
        topups = topups.where(status: params[:status]) if params[:status].present?
        render json: { topups: topups.map { |t| topup_json(t) }, total: topups.total_count,
                       pending: EsimTopup.pending.count }
      end

      # PATCH /admin/api/esim_topups/:id/complete { note }
      def complete
        EsimTopupService.complete!(@topup, note: params[:note])
        render json: topup_json(@topup.reload)
      rescue AASM::InvalidTransition
        render json: { error: 'Only pending top-ups can be completed' }, status: :unprocessable_entity
      end

      # PATCH /admin/api/esim_topups/:id/cancel { note } — refunds the customer
      def cancel
        EsimTopupService.cancel_and_refund!(@topup, note: params[:note])
        render json: topup_json(@topup.reload)
      rescue EsimTopupService::InvalidAmount => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      private

      def set_topup
        @topup = EsimTopup.find(params[:id])
      end

      def topup_json(topup)
        order = topup.order
        esim = order.esim_order&.esims&.first
        {
          id: topup.id, reference: topup.reference, status: topup.status,
          topup_value: topup.topup_value.to_f, price: topup.price.to_f,
          auto: topup.esim_topup_subscription_id.present?, admin_note: topup.admin_note,
          order_id: order.id, order_number: order.order_number, line: order.product&.name,
          phone_number: esim&.msisdn, iccid: esim&.iccid,
          customer: topup.orderable.try(:email), customer_type: topup.orderable_type,
          created_at: topup.created_at, completed_at: topup.completed_at, cancelled_at: topup.cancelled_at
        }
      end
    end
  end
end

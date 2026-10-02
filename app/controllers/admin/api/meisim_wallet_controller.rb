# frozen_string_literal: true

module Admin
  module Api
    # Funding and auditing our MeiSIM dealer wallet. Top-ups are card payments to MeiSIM
    # through their Stripe checkout; the admin opens the returned link and pays there.
    class MeisimWalletController < Admin::Api::BaseController
      before_action :require_admin!
      TOPUP_RANGE = (50..10_000).freeze

      # GET /admin/api/meisim/topup_preview?amount=100
      def topup_preview
        return invalid_amount unless valid_amount?

        preview = MeisimService.new.topup_preview(amount)
        render json: { net: preview['net'], gross: preview['gross'], fee: preview['fee'] }
      rescue MeisimService::Error => e
        render json: { error: e.message }, status: :bad_gateway
      end

      # POST /admin/api/meisim/topup { amount }
      def topup
        return invalid_amount unless valid_amount?

        result = MeisimService.new.topup(amount)
        AuditLog.create(action: 'meisim.topup_link', user_id: current_employee.id, user_type: 'Employee',
                        auditable: current_employee, object_changes: { amount_usd: amount.to_s })
        render json: { checkout_url: result['checkoutUrl'], net: result['netAmt'], gross: result['grossAmt'],
                       fee: result['fee'] }
      rescue MeisimService::Error => e
        render json: { error: e.message }, status: :bad_gateway
      end

      # GET /admin/api/meisim/statement?from=2026-09-01&to=2026-10-01
      def statement
        csv = MeisimService.new.statement(from: date_param(:from), to: date_param(:to))
        send_data csv, type: 'text/csv', filename: "meisim-statement-#{Date.current}.csv"
      rescue MeisimService::Error => e
        render json: { error: e.message }, status: :bad_gateway
      end

      private

      def amount
        params[:amount].to_d
      end

      def valid_amount?
        TOPUP_RANGE.cover?(amount)
      end

      def invalid_amount
        render json: { error: 'Top-up must be between $50 and $10,000' }, status: :unprocessable_entity
      end

      def date_param(key)
        Date.iso8601(params[key]).iso8601 if params[key].present?
      rescue Date::Error
        nil
      end
    end
  end
end

# frozen_string_literal: true

module Admin
  module Api
    # Funding and auditing our MeiSIM dealer wallet. Top-ups are card payments to MeiSIM
    # through their Stripe checkout; the admin opens the returned link and pays there.
    class MeisimWalletController < Admin::Api::BaseController
      before_action :require_admin!
      TOPUP_RANGE = (50..10_000).freeze
      LPA_FORMAT = /\ALPA:1\$[^$\s]+\$[^\s]+\z/i.freeze
      MAX_LPAS = 50_000
      HISTORY_SIZE = 10

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

      # POST /admin/api/meisim/verify { lpas: "LPA:1$...\nLPA:1$...", notify_email }
      # MeiSIM eSIM Verify: $1 per code from the MeiSIM wallet, error rows refunded.
      def verify
        lpas = params[:lpas].to_s.split(/[\s,]+/).map(&:strip).compact_blank.uniq
        return render json: { error: 'Enter at least one activation code' }, status: :unprocessable_entity if lpas.empty?

        bad = lpas.grep_v(LPA_FORMAT)
        if bad.any?
          return render json: { error: "Not an activation code (must start with LPA:1$): #{bad.first(3).join(', ')}" },
                        status: :unprocessable_entity
        end
        if lpas.size > MAX_LPAS
          return render json: { error: "At most #{MAX_LPAS} codes per batch" }, status: :unprocessable_entity
        end

        result = MeisimService.new.esim_verify(lpas, notify_email: params[:notify_email])
        AuditLog.create(action: 'meisim.esim_verify', user_id: current_employee.id, user_type: 'Employee',
                        auditable: current_employee, object_changes: { batch_id: result['batch_id'], codes: lpas.size })
        render json: { batch_id: result['batch_id'], total_rows: result['total_rows'], charged_usd: result['charged_usd'],
                       wallet_balance_usd: result['wallet_balance_usd'] }
      rescue MeisimService::Error => e
        render json: { error: e.message }, status: e.status == 402 ? :payment_required : :bad_gateway
      end

      # GET /admin/api/meisim/verify
      # The last bulk checks with MeiSIM's progress for each, so their results stay on the
      # MeiSIM page after a check is submitted. Batch ids come from the audit log.
      def verify_history
        logs = AuditLog.where(action: 'meisim.esim_verify').order(created_at: :desc).limit(HISTORY_SIZE).to_a
        names = Employee.where(id: logs.map(&:user_id)).to_h { |e| [e.id, e.first_name] }
        render json: { batches: logs.map { |log| serialize_batch(log, names) } }
      end

      # GET /admin/api/meisim/verify/:batch_id
      def verify_status
        result = MeisimService.new.esim_verify_batch(params[:batch_id])
        render json: { batch: result['batch'], progress: result['progress'] }
      rescue MeisimService::Error => e
        render json: { error: e.message }, status: :bad_gateway
      end

      # GET /admin/api/meisim/verify/:batch_id/results
      def verify_results
        csv = MeisimService.new.esim_verify_results_csv(params[:batch_id])
        send_data csv, type: 'text/csv', filename: "esim-verify-#{params[:batch_id]}.csv"
      rescue MeisimService::Error => e
        render json: { error: e.message }, status: :bad_gateway
      end

      private

      def serialize_batch(log, names)
        batch_id = log.object_changes['batch_id']
        { batch_id: batch_id, codes: log.object_changes['codes'], submitted_at: log.created_at.iso8601,
          submitted_by: names[log.user_id], progress: batch_progress(batch_id) }
      end

      # A finished batch never changes, so its progress is kept and MeiSIM is asked only about
      # batches still running. nil when MeiSIM cannot be reached right now.
      def batch_progress(batch_id)
        key = "meisim/verify/#{batch_id}/progress"
        cached = Rails.cache.read(key)
        return cached if cached

        progress = MeisimService.new.esim_verify_batch(batch_id)['progress'] || {}
        Rails.cache.write(key, progress, expires_in: 30.days) if batch_finished?(progress)
        progress
      rescue MeisimService::Error
        nil
      end

      def batch_finished?(progress)
        progress['total'].to_i.positive? && progress['pending'].to_i.zero? && progress['in_progress'].to_i.zero?
      end

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

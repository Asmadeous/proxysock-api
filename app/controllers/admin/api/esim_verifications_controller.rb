# frozen_string_literal: true

module Admin
  module Api
    # Staff check whether a sold eSIM's activation code is still available or already
    # used, through MeiSIM's eSIM Verify ($1 per check from our MeiSIM wallet).
    class EsimVerificationsController < Admin::Api::BaseController
      before_action :set_esim

      # POST /admin/api/esims/:id/verify
      def create
        return render json: { error: 'This eSIM has no activation code to verify' }, status: :unprocessable_entity unless lpa?

        result = MeisimService.new.esim_verify([@esim.activation_code])
        store('batch_id' => result['batch_id'], 'submitted_at' => Time.current.iso8601, 'charged_usd' => result['charged_usd'])
        AuditLog.create(action: 'esim.verify', user_id: current_employee.id, user_type: 'Employee', auditable: @esim)
        render json: { status: 'pending', batch_id: result['batch_id'], charged_usd: result['charged_usd'] }
      rescue MeisimService::Error => e
        render json: { error: e.message }, status: e.status == 402 ? :payment_required : :bad_gateway
      end

      # GET /admin/api/esims/:id/verify
      def show
        batch_id = (@esim.metadata || {}).dig('verification', 'batch_id')
        return render json: { status: 'not_checked' } if batch_id.blank?

        progress = MeisimService.new.esim_verify_batch(batch_id)['progress'] || {}
        status = verdict(progress)
        store('status' => status, 'checked_at' => Time.current.iso8601) unless status == 'pending'
        render json: { status: status, batch_id: batch_id, progress: progress }
      rescue MeisimService::Error => e
        render json: { error: e.message }, status: :bad_gateway
      end

      private

      def set_esim
        @esim = Esim.find(params[:id])
      end

      def lpa?
        @esim.activation_code.to_s.start_with?('LPA:')
      end

      # One code per batch, so the single non-zero bucket is the verdict.
      def verdict(progress)
        return 'pending' if progress['pending'].to_i.positive? || progress['in_progress'].to_i.positive?

        %w[available used invalid unknown].find { |k| progress[k].to_i.positive? } ||
          (progress['error_count'].to_i.positive? ? 'error' : 'pending')
      end

      def store(values)
        metadata = @esim.metadata || {}
        metadata['verification'] = (metadata['verification'] || {}).merge(values)
        @esim.update!(metadata: metadata)
      end
    end
  end
end

# frozen_string_literal: true

module Admin
  module Api
    # Staff check whether a sold eSIM's activation code is still available or already
    # used, through MeiSIM's eSIM Verify ($1 per check from our MeiSIM wallet). MeiSIM has no
    # webhooks: the admin page polls #show, and MeisimVerifyPollJob finishes checks it leaves.
    class EsimVerificationsController < Admin::Api::BaseController
      before_action :set_esim

      # POST /admin/api/esims/:id/verify
      def create
        return render json: { error: 'This eSIM has no activation code to verify' }, status: :unprocessable_entity unless lpa?
        # A check already running answers for this one: submitting again would charge another $1.
        if @esim.verification_status == 'pending'
          return render json: { status: 'pending', batch_id: @esim.verification['batch_id'] }
        end

        result = MeisimService.new.esim_verify([@esim.activation_code])
        @esim.update_verification!('batch_id' => result['batch_id'], 'status' => 'pending', 'submitted_at' => Time.current.iso8601,
                                   'checked_at' => nil, 'charged_usd' => result['charged_usd'], 'requested_by' => current_employee.id)
        AuditLog.create(action: 'esim.verify', user_id: current_employee.id, user_type: 'Employee', auditable: @esim)
        render json: { status: 'pending', batch_id: result['batch_id'], charged_usd: result['charged_usd'] }
      rescue MeisimService::Error => e
        render json: { error: e.message }, status: e.status == 402 ? :payment_required : :bad_gateway
      end

      # GET /admin/api/esims/:id/verify
      def show
        status = @esim.verification_status
        return render json: { status: 'not_checked' } if status.nil?
        return render json: { status: status, batch_id: @esim.verification['batch_id'] } unless status == 'pending'

        status, progress = @esim.refresh_verification!
        render json: { status: status, batch_id: @esim.verification['batch_id'], progress: progress }
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
    end
  end
end

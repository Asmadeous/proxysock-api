# frozen_string_literal: true

module Admin
  module Api
    # Admins recharge MeiSIM phone lines through MeiSIM's top-up API, paid from our MeiSIM
    # wallet: one line from the MeiSIM page or a queued customer top-up, or many in a row
    # (the page sends one request per line; MeiSIM has no bulk top-up).
    class MeisimLineTopupsController < Admin::Api::BaseController
      before_action :require_admin!
      HISTORY_SIZE = 20

      # GET /admin/api/meisim/line_topups
      def index
        logs = AuditLog.where(action: MeisimLineTopupService::AUDIT_ACTION).order(created_at: :desc).limit(HISTORY_SIZE).to_a
        names = Employee.where(id: logs.map(&:user_id)).to_h { |e| [e.id, e.first_name] }
        render json: { topups: logs.map { |log| serialize_log(log, names) } }
      end

      # GET /admin/api/meisim/line_topups/networks
      def networks
        render json: { networks: MeisimLineTopupService.networks }
      rescue MeisimService::Error => e
        render json: { error: e.message }, status: :bad_gateway
      end

      # POST /admin/api/meisim/line_topups/check { network, line }
      def check
        return missing_line unless line_given?

        render json: service.check(network: params[:network], line: params[:line])
      rescue MeisimService::Error => e
        render json: { error: e.message }, status: :bad_gateway
      end

      # POST /admin/api/meisim/line_topups { network, line, value, plan_code, esim_topup_id }
      def create
        return missing_line unless line_given?

        topup = EsimTopup.find(params[:esim_topup_id]) if params[:esim_topup_id].present?
        result = service.recharge!(network: params[:network], line: params[:line], value: params[:value].to_s,
                                   plan_code: params[:plan_code].presence, esim_topup: topup)
        render json: { result: result.status, message: result.message, response: result.response },
               status: result.applied? ? :ok : :bad_gateway
      rescue MeisimLineTopupService::Refused => e
        render json: { result: 'refused', error: e.message }, status: :unprocessable_entity
      end

      private

      def service
        MeisimLineTopupService.new(current_employee)
      end

      def line_given?
        params[:network].present? && params[:line].present?
      end

      def missing_line
        render json: { error: 'Choose a network and enter the phone number or ICCID' }, status: :unprocessable_entity
      end

      def serialize_log(log, names)
        changes = log.object_changes || {}
        { id: log.id, at: log.created_at.iso8601, by: names[log.user_id], network: changes['network'], line: changes['line'],
          value: changes['value'], plan_code: changes['plan_code'], result: changes['result'], message: changes['message'],
          esim_topup_id: changes['esim_topup_id'] }
      end
    end
  end
end

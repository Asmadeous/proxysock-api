# frozen_string_literal: true

module Api
  module V1
    class ExternalVmsController < BaseController
      # Skip standard reseller authentication for this temporary endpoint
      # We will use a dedicated API key instead
      skip_before_action :authenticate_reseller!
      before_action :verify_external_key

      # POST /api/v1/external/provision
      # Temporary endpoint for Supabase integration — bypasses billing/balance logic.
      def provision
        # 1. Prepare parameters
        # Map Supabase's 'proxy_config' to Rails standard 'proxy'
        provision_params = vm_params.to_h
        provision_params[:proxy] = params[:proxy_config] if params[:proxy_config].present?

        # 2. Create records
        vm = nil
        ActiveRecord::Base.transaction do
          # Create an orphaned VM record (optional VmOrder association matches as-is logic)
          # We create a dummy VmOrder to satisfy model requirements and store OS type
          order = Order.new(status: 'completed', metadata: { external_provision: true, source: 'supabase' })
          vm_order = VmOrder.new(
            order: order,
            os_type: provision_params[:os_template],
            cpu_cores: provision_params[:cpu_cores] || 2,
            ram_gb: provision_params[:ram_gb] || 4,
            disk_gb: provision_params[:storage_gb] || 60,
            status: 'pending'
          )
          
          vm = Vm.new(
            vm_order: vm_order,
            status: 'pending',
            vm_type: provision_params[:vm_type] || 'vps',
            hostname: provision_params[:hostname]
          )

          # Skip validations for Order/VmOrder as we don't need a valid Reseller or payment
          order.save(validate: false)
          vm_order.save(validate: false)
          vm.save!
        end

        # 3. Trigger Job
        VmProvisioningJob.perform_later(vm.id, provision_params)

        render json: {
          message: 'External provisioning started',
          vm_id: vm.id,
          status: vm.status
        }, status: :accepted
      rescue StandardError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      private

      def verify_external_key
        expected = ENV['EXTERNAL_PROVISIONING_API_KEY']
        provided = request.headers['X-External-Key'] || request.headers['Authorization']&.sub(/^Bearer\s+/, '')

        return if expected.present? && provided == expected

        render json: { error: 'Unauthorized: Invalid or missing X-External-Key' }, status: :unauthorized
      end

      def vm_params
        params.permit(
          :os_template,
          :vm_type,
          :cpu_cores,
          :ram_gb,
          :storage_gb,
          :hostname,
          :management_type
        )
      end
    end
  end
end

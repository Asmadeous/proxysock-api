# frozen_string_literal: true

module Api
  module V1
    class ExternalVmsController < BaseController
      # Skip standard reseller authentication for this temporary endpoint
      # We will use a dedicated API key instead
      skip_before_action :authenticate_request
      skip_before_action :authenticate_reseller!
      before_action :verify_external_key

      # POST /api/v1/external/provision
      # Temporary endpoint for Supabase integration — bypasses billing/balance logic.
      def provision
        # 1. Prepare parameters
        p_params = vm_params.to_h
        p_params[:callback_url] = params[:callback_url]
        p_params[:job_id]       = params[:job_id]
        p_params[:proxy]        = params[:proxy_config] if params[:proxy_config].present?

        # 2. Create records
        vm = nil
        order = nil
        
        ActiveRecord::Base.transaction do
          owner = Employee.find_by(role: 'admin') || Employee.first
          unless owner
            render json: { error: "No Admin Employee found to own the external order." }, status: :unprocessable_entity
            return
          end

          # Stub missing association for PricingService compatibility without touching core files
          owner.define_singleton_method(:affiliate_referrals) { AffiliateReferral.none }

          product = Product.find_by(product_type: p_params[:vm_type] || 'vps') || Product.first
          pricing = product&.product_pricings&.first

          unless product && pricing
            render json: { error: "Product 'vps' or Pricing not found. Please ensure the product catalog is seeded." }, status: :unprocessable_entity
            return
          end

          # Create system order for metadata consistency
          order = Order.new(
            orderable: owner,
            product: product,
            product_pricing: pricing,
            status: 'processing',
            total_amount: pricing.selling_price,
            metadata: {
              external_provision: true,
              callback_url: p_params[:callback_url],
              external_job_id: p_params[:job_id]
            }
          )

          # Crucial: Since we cannot touch the core PricingService to handle Employee actors,
          # and Order has a before_save callback that calls PricingService,
          # we must ensure that we don't trigger that callback in a way that crashes.
          # We've already set the total_amount above.
          
          vm_order = VmOrder.new(
            order: order,
            vm_type: p_params[:vm_type] || 'vps',
            os_type: p_params[:os_template],
            cpu_cores: p_params[:cpu_cores] || 2,
            ram_gb: p_params[:ram_gb] || 4,
            disk_gb: p_params[:storage_gb] || 60,
            status: 'pending'
          )

          vm = Vm.new(
            status: 'pending',
            vm_type: p_params[:vm_type] || 'vps',
            vm_order: vm_order,
            hostname: p_params[:hostname]
          )

          # We use save(validate: false) on the order if absolutely necessary to bypass 
          # potential callback crashes, but first let's try a standard save with the 
          # attribute errors fixed.
          unless order.save && vm_order.save && vm.save
            errors = order.errors.full_messages + vm_order.errors.full_messages + vm.errors.full_messages
            render json: { error: errors.join(", ") }, status: :unprocessable_entity
            return
          end
        end

        # 3. Trigger Job
        VmProvisioningJob.perform_later(vm.id, p_params)

        render json: {
          message: 'External provisioning started',
          vm_id: vm.id,
          status: vm.status,
          order_id: order.id
        }, status: :accepted
      rescue StandardError => e
        # If the PricingService crash still happens, we'll catch it here and know
        render json: { error: "Internal Server Error: #{e.message}" }, status: :internal_server_error
      end

      # GET /api/v1/external/vms/:id/metadata
      def metadata
        vm = Vm.find(params[:id])
        order = vm.vm_order&.order
        
        render json: {
          callback_url: order&.metadata&.[]('callback_url'),
          job_id: order&.metadata&.[]('external_job_id')
        }
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'VM not found' }, status: :not_found
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

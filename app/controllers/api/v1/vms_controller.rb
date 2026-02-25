# frozen_string_literal: true

module Api
  module V1
    class VmsController < BaseController
      before_action :set_vm, only: %i[show destroy start stop restart status]

      # GET /api/v1/vms
      def index
        @vms = current_reseller_vms.includes(:vm_order)

        render json: {
          vms: @vms.map { |vm| serialize_vm(vm) }
        }
      end

      # GET /api/v1/vms/:id
      def show
        render json: { vm: serialize_vm(@vm) }
      end

      # POST /api/v1/vms
      def create
        order = create_vm_order
        vm = order.vm_order.create_vm!(
          status: 'pending',
          vm_type: vm_params[:vm_type]
        )

        if order.save
          begin
            OrderProvisioningService.new(order, @current_reseller).process!

            render json: {
              message: 'VM order created and provisioning started',
              vm_id: vm.id,
              status: vm.status
            }, status: :accepted
          rescue StandardError => e
            render json: { error: e.message }, status: :payment_required
          end
        else
          render json: { errors: order.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/vms/:id
      def destroy
        VmCleanupJob.perform_later(@vm.id)

        render json: { message: 'VM cleanup initiated', vm_id: @vm.id }
      end

      # POST /api/v1/vms/:id/start
      def start
        # TODO: Implement start via Proxmox
        render json: { message: 'Start command sent', vm_id: @vm.id }
      end

      # POST /api/v1/vms/:id/stop
      def stop
        # TODO: Implement stop via Proxmox
        render json: { message: 'Stop command sent', vm_id: @vm.id }
      end

      # POST /api/v1/vms/:id/restart
      def restart
        # TODO: Implement restart via Proxmox
        render json: { message: 'Restart command sent', vm_id: @vm.id }
      end

      # GET /api/v1/vms/:id/status
      def status
        # Use cache for status
        cached_status = Rails.cache.fetch("vm_status_#{@vm.id}", expires_in: 5.minutes) do
          @vm.status
        end

        render json: {
          vm_id: @vm.id,
          status: cached_status,
          ip_address: @vm.ip_address,
          proxmox_vm_id: @vm.proxmox_vm_id
        }
      end

      private

      def set_vm
        @vm = current_reseller_vms.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'VM not found' }, status: :not_found
      end

      def current_reseller_vms
        Vm.joins(vm_order: :order)
          .where(orders: { orderable_type: 'Reseller', orderable_id: @current_reseller.id })
      end

      def vm_params
        params.require(:vm).permit(
          :os_template,
          :vm_type,
          :cpu_cores,
          :ram_gb,
          :storage_gb,
          :hostname,
          :management_type
        )
      end

      def create_vm_order
        # Create Order -> VmOrder chain
        product = Product.find_by!(product_type: %w[vps rdp vm], slug: vm_params[:os_template])
        pricing = product.product_pricings.active.first!

        reseller_order = @current_reseller.reseller_orders.create!(
          product: product,
          product_pricing: pricing,
          orderable_type: 'VmOrder',
          orderable_id: 0 # Will be updated
        )

        order = Order.create!(
          orderable: reseller_order,
          product: product,
          product_pricing: pricing,
          status: 'processing'
        )

        vm_order = VmOrder.create!(
          order: order,
          os_type: vm_params[:os_template],
          vm_type: vm_params[:vm_type],
          cpu_cores: vm_params[:cpu_cores] || 2,
          ram_gb: vm_params[:ram_gb] || 4,
          disk_gb: vm_params[:storage_gb] || 60,
          status: 'pending'
        )

        reseller_order.update!(orderable: vm_order)
        order
      end

      def serialize_vm(vm)
        {
          id: vm.id,
          status: vm.status,
          vm_type: vm.vm_type,
          ip_address: vm.ip_address,
          proxmox_vm_id: vm.proxmox_vm_id,
          ssh_port: vm.ssh_port,
          rdp_port: vm.rdp_port,
          created_at: vm.created_at
        }
      end
    end
  end
end

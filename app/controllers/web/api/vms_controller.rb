# frozen_string_literal: true

module Web
  module Api
    class VmsController < BaseController
      before_action :authenticate_request
      before_action :set_vm, only: %i[show destroy start stop status]

      # GET /web/api/vms
      def index
        @vms = current_actor_vms.includes(:vm_order)

        render json: {
          vms: @vms.map { |vm| serialize_vm(vm) }
        }
      end

      # GET /web/api/vms/:id
      def show
        render json: { vm: serialize_vm(@vm) }
      end

      # POST /web/api/vms
      def create
        order = create_vm_order
        # No need to create VM here if Job does it, but current code does:
        vm = Vm.create!(
          vm_order: order.vm_order,
          status: 'pending',
          vm_type: vm_params[:vm_type]
        )

        # Enqueue async provisioning
        VmProvisioningJob.perform_later(vm.id, vm_params.to_h)

        render json: {
          message: 'VM provisioning started',
          vm_id: vm.id,
          status: 'pending'
        }, status: :accepted
      end

      # DELETE /web/api/vms/:id
      def destroy
        VmCleanupJob.perform_later(@vm.id)

        render json: { message: 'VM cleanup initiated', vm_id: @vm.id }
      end

      # POST /web/api/vms/:id/start
      def start
        render json: { message: 'Start command sent', vm_id: @vm.id }
      end

      # POST /web/api/vms/:id/stop
      def stop
        render json: { message: 'Stop command sent', vm_id: @vm.id }
      end

      # GET /web/api/vms/:id/status
      def status
        cache_key = "vm_status_#{@vm.id}_v1_#{@vm.updated_at.to_i}"
        cached_status = Rails.cache.fetch(cache_key, expires_in: 24.hours) do
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
        @vm = current_actor_vms.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'VM not found' }, status: :not_found
      end

      def current_actor_vms
        # Find VMs where the master order belongs to this actor (either directly or via EcommerceOrder)
        Vm.joins(vm_order: :order).where(orders: { orderable: current_actor })
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
        product = Product.find_by!(product_type: 'vm', slug: vm_params[:os_template])
        pricing = product.product_pricings.active.first!

        # Direct Order for both User and Reseller
        order = Order.create!(
          orderable: current_actor,
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

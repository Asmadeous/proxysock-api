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
            # Provision in the background — VM + proxy provisioning can take minutes
            # (provider IP assignment), so it must not block this API request.
            OrderProvisioningJob.perform_later(order.id, @current_reseller.id, @current_reseller.class.name)

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
        VmControlJob.perform_later(@vm.id, 'start')
        render json: { message: 'Start command sent', vm_id: @vm.id, status: 'starting' }
      end

      # POST /api/v1/vms/:id/stop
      def stop
        VmControlJob.perform_later(@vm.id, 'stop')
        render json: { message: 'Stop command sent', vm_id: @vm.id, status: 'stopping' }
      end

      # POST /api/v1/vms/:id/restart
      def restart
        VmControlJob.perform_later(@vm.id, 'reboot')
        render json: { message: 'Restart command sent', vm_id: @vm.id, status: 'restarting' }
      end

      # GET /api/v1/vms/:id/status
      def status
        resource_usage = nil
        if @vm.proxmox_vm_id.present? && @vm.proxmox_node.present? && (pve_status = ProxmoxApiClient.get_vm_status(@vm.proxmox_node, @vm.proxmox_vm_id))
          resource_usage = {
            cpu_percent: (pve_status['cpu'] || 0) * 100,
            ram_percent: pve_status['maxmem'].to_f.positive? ? ((pve_status['mem'] || 0).to_f / pve_status['maxmem']) * 100 : 0,
            disk_percent: pve_status['maxdisk'].to_f.positive? ? ((pve_status['disk'] || 0).to_f / pve_status['maxdisk']) * 100 : 0,
            uptime: pve_status['uptime'] || 0,
            status: pve_status['status']
          }
        end

        # Use cache for status if Proxmox fetch fails
        cached_status = Rails.cache.fetch("vm_status_#{@vm.id}", expires_in: 5.minutes) { @vm.status }

        render json: {
          vm_id: @vm.id,
          status: resource_usage&.dig(:status) || cached_status,
          ip_address: @vm.ip_address,
          proxmox_vm_id: @vm.proxmox_vm_id,
          resource_usage: resource_usage
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
        product = Product.find_by!(product_type: %w[vps rdp vm], slug: vm_params[:os_template])
        pricing = product.product_pricings.where(active: true).first!

        order = nil
        ActiveRecord::Base.transaction do
          order = Order.new(
            orderable: @current_reseller,
            product: product,
            product_pricing: pricing,
            status: 'processing'
          )

          vm_order = VmOrder.new(
            order: order,
            os_type: vm_params[:os_template],
            vm_type: vm_params[:vm_type],
            cpu_cores: vm_params[:cpu_cores] || 2,
            ram_gb: vm_params[:ram_gb] || 4,
            disk_gb: vm_params[:storage_gb] || 60,
            status: 'pending'
          )

          order.save!
          vm_order.save!

          ResellerOrder.create!(
            reseller: @current_reseller,
            order: order,
            orderable: vm_order
          )
        end

        order
      end

      def serialize_vm(vm)
        order = vm.vm_order&.order
        {
          id: vm.id,
          order_id: order&.id,
          order_number: order&.order_number,
          status: vm.status,
          vm_type: vm.vm_type,
          ip_address: vm.ip_address,
          proxmox_vm_id: vm.proxmox_vm_id,
          ssh_port: vm.ssh_port,
          rdp_port: vm.rdp_port,
          auto_renew: !(order&.metadata || {})['auto_renew'].nil?,
          renewal_method: (order&.metadata || {})['renewal_method'] || 'wallet',
          expires_at: vm.expires_at,
          created_at: vm.created_at
        }
      end
    end
  end
end

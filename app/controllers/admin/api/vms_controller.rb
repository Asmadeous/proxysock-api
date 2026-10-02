# frozen_string_literal: true

module Admin
  module Api
    class VmsController < Admin::Api::BaseController
      before_action :set_vm, only: %i[show start stop reboot status destroy]
      before_action :require_vm!, only: %i[start stop reboot status destroy]

      # GET /admin/api/vms
      def index
        vms = VmOrder.joins(:order).preload(:vm, order: %i[orderable product]).order(created_at: :desc)

        vms = vms.where(vm_type: params[:vm_type]) if params[:vm_type].present?
        vms = vms.left_joins(:vm).where(vms: { status: params[:status] }) if params[:status].present?
        vms = vms.where(orders: { orderable_type: params[:entity_type] }) if params[:entity_type].present?

        if params[:q].present?
          vms = vms.left_joins(:vm).where('vms.hostname ILIKE :q OR vms.ip_address ILIKE :q OR vms.proxmox_vm_id::text ILIKE :q OR orders.id::text ILIKE :q', q: "%#{params[:q]}%")
        end

        page_num = (params[:page] || 1).to_i
        per_page = (params[:per] || 25).to_i
        vms = vms.page(page_num).per(per_page)

        render json: {
          vms: vms.map { |vm| vm_json(vm) },
          total: vms.total_count,
          page: vms.current_page
        }
      end

      # GET /admin/api/vms/:id
      def show
        render json: vm_json(@vm, full: true)
      end

      # POST /admin/api/vms/:id/start
      def start
        control('start')
      end

      # POST /admin/api/vms/:id/stop
      def stop
        control('stop')
      end

      # POST /admin/api/vms/:id/reboot
      def reboot
        control('reboot')
      end

      # GET /admin/api/vms/:id/status
      def status
        render json: { status: vm_record.status, proxmox_vm_id: vm_record.proxmox_vm_id }
      end

      # DELETE /admin/api/vms/:id
      def destroy
        require_admin!
        return if performed?

        VmCleanupJob.perform_later(vm_record.id)
        audit('vm.deleted')
        render json: { message: 'VM deletion initiated' }
      end

      private

      def set_vm
        @vm = VmOrder.find(params[:id])
      end

      def require_vm!
        render json: { error: 'VM not provisioned yet' }, status: :unprocessable_entity unless @vm.vm
      end

      def vm_record
        @vm.vm
      end

      # Same path the reseller API uses: a background job drives Proxmox by the VM's Proxmox id.
      def control(action)
        return render json: { error: 'VM has no Proxmox id yet' }, status: :unprocessable_entity if vm_record.proxmox_vm_id.blank?

        VmControlJob.perform_later(vm_record.id, action)
        audit("vm.#{action}")
        render json: { message: "VM #{action} initiated" }
      end

      def audit(action)
        AuditLog.create(action: action, user_id: current_employee.id, user_type: 'Employee', auditable: vm_record)
      rescue StandardError
        nil
      end

      # Login and state from the VM itself (the vm_order's status is never updated after
      # provisioning), in the shape the admin VPS and RDP pages read.
      def vm_json(vm_order, full: false)
        vm = vm_order.vm
        order = vm_order.order
        entity = order&.orderable
        login = vm&.login_details || {}

        {
          id: vm_order.id,
          vm_id: vm&.proxmox_vm_id,
          vm_type: vm_order.vm_type,
          status: vm&.status || vm_order.status,
          hostname: vm&.hostname,
          host: login[:host],
          ip_address: vm&.ip_address,
          dns_name: vm&.dns_name,
          private_ip_address: vm&.private_ip_address,
          protocol: login[:protocol],
          port: login[:port],
          ssh_port: login[:ssh_port],
          rdp_port: login[:rdp_port],
          username: login[:username],
          password: login[:password],
          rdp_username: login[:username],
          rdp_password: login[:password],
          cpu_cores: vm_order.cpu_cores,
          ram_gb: vm_order.ram_gb,
          storage_gb: vm_order.disk_gb,
          os_type: vm_order.os_type,
          created_at: vm_order.created_at,
          expires_at: vm&.expires_at || order&.expires_at,
          order_id: vm_order.order_id,
          order_number: order&.order_number,
          user_email: entity&.email,
          entity_type: order&.orderable_type,
          plan_name: order&.product&.name
        }.tap { |data| data[:proxmox_node] = vm&.proxmox_node if full }
      end
    end
  end
end

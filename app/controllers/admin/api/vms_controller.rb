# frozen_string_literal: true

module Admin
  module Api
    class VmsController < Admin::Api::BaseController
      before_action :set_vm, only: %i[show start stop reboot status destroy]

      # GET /admin/api/vms
      def index
        vms = VmOrder.joins(:order).preload(:vm, :order => :orderable).order(created_at: :desc)
        
        vms = vms.where(vm_type: params[:vm_type]) if params[:vm_type].present?
        vms = vms.where(status: params[:status]) if params[:status].present?
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
        begin
          res = ProxmoxService.new.start_vm(@vm.vm_id)
          @vm.update!(status: 'starting')
          record_audit_log('vm.started', @vm)
          render json: { message: 'VM start initiated', response: res }
        rescue => e
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end

      # POST /admin/api/vms/:id/stop
      def stop
        begin
          res = ProxmoxService.new.stop_vm(@vm.vm_id)
          @vm.update!(status: 'stopping')
          record_audit_log('vm.stopped', @vm)
          render json: { message: 'VM stop initiated', response: res }
        rescue => e
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end

      # POST /admin/api/vms/:id/reboot
      def reboot
        begin
          res = ProxmoxService.new.reboot_vm(@vm.vm_id)
          @vm.update!(status: 'rebooting')
          record_audit_log('vm.rebooted', @vm)
          render json: { message: 'VM reboot initiated', response: res }
        rescue => e
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end

      # GET /admin/api/vms/:id/status
      def status
        begin
          status = ProxmoxService.new.vm_status(@vm.vm_id)
          render json: status
        rescue => e
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end

      # DELETE /admin/api/vms/:id
      def destroy
        begin
          # Dangerous! Only for admins
          require_admin!
          res = ProxmoxService.new.delete_vm(@vm.vm_id)
          @vm.update!(status: 'terminated')
          record_audit_log('vm.deleted', @vm)
          render json: { message: 'VM deletion initiated', response: res }
        rescue => e
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end

      private

      def set_vm
        @vm = VmOrder.find(params[:id])
      end

      def vm_json(vm_order, full: false)
        vm = vm_order.vm
        order = vm_order.order
        entity = order&.orderable

        data = {
          id: vm_order.id,
          vm_id: vm&.proxmox_vm_id,
          vm_type: vm_order.vm_type,
          status: vm_order.status,
          hostname: vm&.hostname,
          ip_address: vm&.ip_address,
          dns_name: vm&.dns_name,
          private_ip_address: vm&.private_ip_address,
          rdp_port: vm&.rdp_port,
          rdp_username: vm&.rdp_username,
          created_at: vm_order.created_at,
          expires_at: order&.expires_at || vm&.expires_at,
          order_id: vm_order.order_id,
          user_email: entity&.email,
          entity_type: order&.orderable_type,
          plan_name: order&.product&.name
        }
        if (full || true)
           data[:rdp_password] = vm&.root_password || vm&.rdp_password_encrypted
        end
        data
      end
    end
  end
end

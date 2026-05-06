# frozen_string_literal: true

module Web
  module Api
    class MonitoringController < BaseController
      # This controller allows users to log into the monitoring dashboard
      # using their VM ID and VM Root Password.
      

      def summary_counts
        authenticate_actor!
        actor = current_actor
        counts = {
          orders: actor.orders.where(status: ['active', 'processing']).count,
          tickets: actor.tickets.where(status: 'open').count,
          notifications: actor.notifications.unread.count
        }
        render json: counts
      end

      def login
        vm_id = params[:vm_id] # This should be the Proxmox VM ID (e.g., 20001)
        password = params[:password]

        # 1. Find the VM in the database
        vm = Vm.find_by(proxmox_vm_id: vm_id)

        # 2. Check the password
        # Since we store root_password in plain text for Ansible, we check it directly.
        if vm && vm.root_password == password && vm.active?
          # 3. Success!
          render json: {
            status: 'success',
            vm_id: vm.proxmox_vm_id,
            hostname: vm.hostname || "vm-#{vm.id}"
          }
        else
          render json: { error: 'Invalid VM ID or Password' }, status: :unauthorized
        end
      end
    end
  end
end

# frozen_string_literal: true

# Concern to log Proxmox operations on VMs for auditing.
# Include in VmProvisioningService or call directly.
#
# Usage:
#   ProxmoxAudit.log(vm: vm, operation: 'create', params: { ... })
#   ProxmoxAudit.log(vm: vm, operation: 'start', status: 'success')
#   ProxmoxAudit.log(vm: vm, operation: 'backup', status: 'failed', error: '...')
module ProxmoxAudit
  OPERATIONS = %w[create clone start stop restart destroy resize backup snapshot configure].freeze

  def self.log(vm:, operation:, status: 'success', error: nil, params: {}, response: {})
    ProxmoxOperation.create!(
      vm: vm,
      operation_type: operation,
      proxmox_vm_id: vm.proxmox_vm_id.to_s,
      proxmox_node: ENV.fetch('PROXMOX_NODE', 'pve'),
      status: status,
      error_message: error&.truncate(1000),
      request_params: params,
      response_data: response
    )
  rescue StandardError => e
    Rails.logger.error("[ProxmoxAudit] Failed to log operation: #{e.message}")
  end
end

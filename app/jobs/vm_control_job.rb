# frozen_string_literal: true

class VmControlJob < ApplicationJob
  queue_as :default

  def perform(vm_id, action)
    vm = Vm.find(vm_id)
    service = VmProvisioningService.new(nil, Rails.logger)
    
    proxmox_id = vm.proxmox_vm_id
    unless proxmox_id.present?
      Rails.logger.error("[VmControlJob] VM #{vm_id} has no proxmox_vm_id")
      return
    end

    result = nil
    case action.to_s
    when 'start'
      result = service.start_vm(proxmox_id)
    when 'stop'
      result = service.stop_vm(proxmox_id)
    when 'shutdown'
      result = service.shutdown_vm(proxmox_id)
    when 'reboot'
      result = service.reboot_vm(proxmox_id)
    else
      raise "Unsupported VM action: #{action}"
    end

    # Log the action
    ProxmoxAudit.log(
      vm: vm,
      operation: action,
      status: 'success',
      params: { action: action, source: 'job' }
    )

    # Optional: Update status or notify via ActionCable?
    # For now just log.
  rescue StandardError => e
    Rails.logger.error("[VmControlJob] Failed to execute #{action} on VM #{vm_id}: #{e.message}")
    ProxmoxAudit.log(
      vm: vm,
      operation: action,
      status: 'failed',
      error: e.message
    )
    raise e
  end
end

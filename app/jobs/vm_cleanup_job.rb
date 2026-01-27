# frozen_string_literal: true

class VmCleanupJob < ApplicationJob
  queue_as :default

  retry_on StandardError, wait: 10.seconds, attempts: 2

  def perform(vm_id)
    vm = Vm.find(vm_id)

    logger.info "[VmCleanupJob] Starting cleanup for VM #{vm_id}"

    service = VmProvisioningService.new(nil, logger)

    service.cleanup_vm(
      vm.proxmox_vm_id,
      vm.ip_address,
      vm.rdp_port || vm.ssh_port,
      "vm-#{vm_id}"
    )

    vm.terminate! if vm.may_terminate?

    # Invalidate cache
    Rails.cache.delete("vm_status_#{vm_id}")

    logger.info "[VmCleanupJob] VM #{vm_id} cleanup completed"
  rescue ActiveRecord::RecordNotFound
    logger.warn "[VmCleanupJob] VM #{vm_id} not found, skipping"
  rescue StandardError => e
    logger.error "[VmCleanupJob] Cleanup failed for VM #{vm_id}: #{e.message}"
    raise e
  end
end

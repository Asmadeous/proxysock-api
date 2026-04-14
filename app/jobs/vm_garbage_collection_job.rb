# frozen_string_literal: true

# VmGarbageCollectionJob
#
# Runs periodically to destroy VMs that have been expired or failed for longer
# than the grace period without being re-ordered by the user.
#
# Policy:
#   - Expired VMs: Retained for 7 days after expiry. If the user hasn't renewed
#     or re-ordered in that window, the VM is fully destroyed and resources freed.
#   - Failed VMs: Retained for 3 days after failure. If admin hasn't rescued
#     the VM, it is destroyed.
#
class VmGarbageCollectionJob < ApplicationJob
  queue_as :maintenance

  EXPIRED_GRACE_PERIOD  = 30.days
  FAILED_GRACE_PERIOD   = 3.days

  def perform
    Rails.logger.info '[VmGarbageCollectionJob] Starting VM garbage collection...'

    collect_expired_vms
    collect_failed_vms

    Rails.logger.info '[VmGarbageCollectionJob] Garbage collection complete.'
  end

  private

  def collect_expired_vms
    stale_vms = Vm.where(status: 'expired')
                  .where('expires_at < ?', EXPIRED_GRACE_PERIOD.ago)

    Rails.logger.info "[VmGarbageCollectionJob] Found #{stale_vms.count} expired VMs past #{EXPIRED_GRACE_PERIOD.inspect} grace period"

    stale_vms.find_each do |vm|
      destroy_vm(vm, 'expired')
    end
  end

  def collect_failed_vms
    stale_vms = Vm.where(status: 'failed')
                  .where('updated_at < ?', FAILED_GRACE_PERIOD.ago)

    Rails.logger.info "[VmGarbageCollectionJob] Found #{stale_vms.count} failed VMs past #{FAILED_GRACE_PERIOD.inspect} grace period"

    stale_vms.find_each do |vm|
      destroy_vm(vm, 'failed')
    end
  end

  def destroy_vm(vm, reason)
    Rails.logger.info "[VmGarbageCollectionJob] Destroying #{reason} VM #{vm.id} (Proxmox: #{vm.proxmox_vm_id})"

    if vm.proxmox_vm_id.present?
      service = VmProvisioningService.new(nil, Rails.logger)
      service.cleanup_vm(
        vm.proxmox_vm_id,
        vm.ip_address,
        vm.hostname,
        nil,
        vm.id
      )
    end

    vm.update!(status: 'terminated')

    # Mark associated order as terminated
    vm.order&.update(status: 'terminated') if vm.order&.status == 'expired'

    Rails.logger.info "[VmGarbageCollectionJob] VM #{vm.id} fully destroyed and resources released"
  rescue StandardError => e
    Rails.logger.error "[VmGarbageCollectionJob] Failed to destroy VM #{vm.id}: #{e.message}"
  end
end

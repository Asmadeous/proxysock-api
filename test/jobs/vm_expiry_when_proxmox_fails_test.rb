# frozen_string_literal: true

require 'test_helper'

# A VM whose Proxmox stop fails (VM gone, Proxmox unreachable) used to roll its expiry
# back every hour and stay "active" forever. It now expires, admins are told once, and
# the garbage collector removes it after the grace period.
class VmExpiryWhenProxmoxFailsTest < ActiveJob::TestCase
  setup do
    Employee.create!(email: "staff_#{SecureRandom.hex(4)}@test.com", first_name: 'Sam', last_name: 'Staff',
                     role: 'admin', active: true, department: departments(:one))
    @vm = Vm.create!(status: 'active', vm_type: 'rdp', ip_address: '64.6.175.97', rdp_port: 51_577,
                     proxmox_node: 'pve', proxmox_vm_id: '10003', expires_at: Time.utc(2026, 5, 1), metadata: {})
    VmProvisioningService.any_instance.stubs(:stop_vm)
                         .raises(RuntimeError, 'Proxmox task failed: unable to find configuration file for VM 10003')
  end

  test 'the VM still expires when Proxmox cannot stop it, and admins are told once' do
    ExpirationCleanupJob.perform_now

    @vm.reload
    assert_equal 'expired', @vm.status
    assert_includes @vm.metadata['stop_error'], 'unable to find configuration file'
    assert_equal 1, Notification.where(title: 'Expired VM not stopped').count

    ExpirationCleanupJob.perform_now
    assert_equal 1, Notification.where(title: 'Expired VM not stopped').count, 'an expired VM is not retried'
  end

  test 'the garbage collector then removes it' do
    VmProvisioningService.any_instance.stubs(:cleanup_vm)
    ExpirationCleanupJob.perform_now

    VmGarbageCollectionJob.perform_now

    assert_equal 'terminated', @vm.reload.status
  end

  test 'an expired VM is no longer health-checked or alerted' do
    ExpirationCleanupJob.perform_now
    VmHealthCheckJob.any_instance.expects(:ping_vm).never

    VmHealthCheckJob.perform_now
  end
end

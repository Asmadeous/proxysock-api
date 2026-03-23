# frozen_string_literal: true

require 'test_helper'

class ExpirationCleanupJobTest < ActiveJob::TestCase
  setup do
    # Create proper order hierarchy
    user = User.create!(email: 'test_expire@example.com', password: 'password', username: 'test_expire',
                        first_name: 'Test', last_name: 'Expire')
    @order = Order.create!(orderable: user, product: products(:one), product_pricing: product_pricings(:pricing_one),
                           status: 'active')
    @vm_order = VmOrder.create!(order: @order, cpu_cores: 2, ram_gb: 4, disk_gb: 50, os_type: 'ubuntu')

    # Create VM in pending state first
    @vm = Vm.create!(
      vm_order: @vm_order,
      ip_address: '1.1.1.1',
      proxmox_vm_id: '100',
      expires_at: 1.hour.ago
    )
    # Bypass AASM to set active state directly
    @vm.update_column(:status, 'active')
    @vm.reload

    @active_vm = Vm.create!(
      vm_order: @vm_order,
      ip_address: '2.2.2.2',
      proxmox_vm_id: '101',
      expires_at: 1.hour.from_now
    )
    # Bypass AASM to set active state directly
    @active_vm.update_column(:status, 'active')
    @active_vm.reload

    # Stub VmProvisioningService to avoid external API calls during testing
    VmProvisioningService.any_instance.stubs(:cleanup_vm).returns(true)
    VmProvisioningService.any_instance.stubs(:stop_vm).returns(true)
  end

  test 'terminates expired resources' do
    # Verify setup - VM should be active and terminable
    assert_equal 'active', @vm.status
    assert @vm.may_terminate?, 'VM should be terminable from active state'

    # First verify terminate! works directly
    @vm.terminate!
    assert_equal 'terminated', @vm.status, 'Direct terminate! should work'

    # Now test with job - create a fresh expired VM
    expired_vm = Vm.create!(
      vm_order: @vm_order,
      ip_address: '3.3.3.3',
      proxmox_vm_id: '102',
      expires_at: 1.hour.ago
    )
    expired_vm.update_column(:status, 'active')
    expired_vm.reload

    # Verify the job's query finds this VM
    found_vms = Vm.where(status: 'active').where('expires_at < ?', Time.current)
    assert found_vms.include?(expired_vm),
           "Job query should find expired_vm. Found: #{found_vms.pluck(:id)}, expired_vm.id: #{expired_vm.id}"

    ExpirationCleanupJob.perform_now

    expired_vm.reload
    assert_equal 'expired', expired_vm.status

    @active_vm.reload
    assert_equal 'active', @active_vm.status
  end
end

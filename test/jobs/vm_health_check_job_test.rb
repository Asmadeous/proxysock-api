# frozen_string_literal: true

require 'test_helper'

# Unreachable VMs alert staff once (on the second failed check) and once when they
# recover, instead of on every 30-minute check; RDP servers are checked on their RDP port.
class VmHealthCheckJobTest < ActiveJob::TestCase
  setup do
    Employee.create!(email: "staff_#{SecureRandom.hex(4)}@test.com", first_name: 'Sam', last_name: 'Staff',
                     role: 'admin', active: true, department: departments(:one))
    @vm = Vm.create!(status: 'active', vm_type: 'rdp', ip_address: '64.6.175.97', rdp_port: 51_577,
                     proxmox_node: 'pve', proxmox_vm_id: '20010', metadata: {})
    ProxmoxApiClient.stubs(:get_vm_status).returns({ 'status' => 'running' })
    VmHealthCheckJob.any_instance.stubs(:system).returns(false) # ICMP blocked
  end

  def alerts(title = 'VM Health Alert: Unreachable')
    Notification.where(title: title).count
  end

  test 'alerts once while a VM stays unreachable, then once when it recovers' do
    VmHealthCheckJob.any_instance.stubs(:tcp_check).returns(false)

    VmHealthCheckJob.perform_now
    assert_equal 0, alerts, 'one failed check is not an alert'
    3.times { VmHealthCheckJob.perform_now }
    assert_equal 1, alerts, 'later checks do not repeat the alert'

    VmHealthCheckJob.any_instance.stubs(:tcp_check).returns(true)
    2.times { VmHealthCheckJob.perform_now }
    assert_equal 1, alerts('VM Health: Recovered')
    assert_equal 0, @vm.reload.metadata['consecutive_failures']
  end

  test 'an RDP server is checked on its RDP port, not SSH port 22' do
    VmHealthCheckJob.any_instance.expects(:tcp_check).with('64.6.175.97', 51_577).returns(true)

    VmHealthCheckJob.perform_now

    assert_equal 'healthy', @vm.reload.metadata['health_status']
  end
end

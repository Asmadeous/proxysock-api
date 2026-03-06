# frozen_string_literal: true

require 'test_helper'

class VmProvisioningJobTest < ActiveJob::TestCase
  setup do
    @order = Order.create!(
      orderable: resellers(:one),
      product: products(:one),
      product_pricing: product_pricings(:pricing_one),
      status: 'processing'
    )
    @test_vm = Vm.create!(
      order: @order,
      status: 'pending',
      vm_type: 'shared-cpu'
    )
  end

  test 'provisioning success' do
    # Mock VmProvisioningService to succeed
    mock_service = mock
    mock_service.expects(:provision).returns({
                                               ip_address: '10.0.0.5',
                                               vm_id: '200',
                                               external_port: 10_022,
                                               protocol: 'ssh',
                                               username: 'root',
                                               password: 'password',
                                               root_password: 'rootpassword'
                                             })

    VmProvisioningService.stubs(:new).returns(mock_service)

    perform_enqueued_jobs do
      VmProvisioningJob.perform_later(@test_vm.id)
    end

    @test_vm.reload
    assert @test_vm.active?
    assert_equal '10.0.0.5', @test_vm.ip_address
    assert_equal 'root', @test_vm.ssh_username
  end

  test 'provisioning failure handles state' do
    # Simplest valid VM:
    product = products(:one)
    pricing = product.product_pricings.where(active: true).first
    order = Order.create!(orderable: users(:one), product: product, product_pricing: pricing, status: 'processing')
    vm_order = VmOrder.create!(order: order, os_type: 'ubuntu', vm_type: 'shared', cpu_cores: 1, ram_gb: 1,
                               disk_gb: 10, status: 'pending')
    fail_vm = vm_order.create_vm!(status: 'pending')

    service_mock = mock
    service_mock.expects(:provision).raises(StandardError, 'Proxmox error')

    VmProvisioningService.stubs(:new).returns(service_mock)

    VmProvisioningJob.perform_now(fail_vm.id, {})

    fail_vm.reload
    assert fail_vm.failed?
  end
end

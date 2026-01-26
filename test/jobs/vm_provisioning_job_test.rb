require "test_helper"

class VmProvisioningJobTest < ActiveJob::TestCase
  setup do
    @order = Order.create!(
      reseller: resellers(:reseller_one),
      product: products(:vm_product),
      product_pricing: product_pricings(:vm_pricing),
      status: "processing"
    )
    @vm = Vm.create!(
      order: @order,
      status: "pending",
      vm_type: "shared-cpu"
    )
  end

  test "provisioning success" do
    # Mock VmProvisioningService to succeed
    mock_service = Minitest::Mock.new
    mock_service.expect :provision, {
      ip_address: "10.0.0.5",
      vm_id: "200",
      external_port: 10022,
      protocol: "ssh",
      username: "root",
      password: "password",
      root_password: "rootpassword"
    }, [Hash]
    
    VmProvisioningService.stub :new, mock_service do
      perform_enqueued_jobs do
        VmProvisioningJob.perform_later(@vm.id)
      end
    end
    
    @vm.reload
    assert @vm.active?
    assert_equal "10.0.0.5", @vm.ip_address
    assert_equal "root", @vm.ssh_username
  end

  test "provisioning failure handles state" do
    # Mock service to raise error
    VmProvisioningService.stub :new, ->(*args) { raise StandardError, "Proxmox error" } do
      assert_raises(StandardError) do
        perform_enqueued_jobs do
          VmProvisioningJob.perform_later(@vm.id)
        end
      end
    end
    
    @vm.reload
    # Job retry mechanism might keep it in pending/provisioning, or fail it.
    # Current implementation sets to failed on error in job (rescue block).
    assert @vm.failed?
  end
end

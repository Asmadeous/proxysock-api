require "test_helper"

class ExpirationCleanupJobTest < ActiveJob::TestCase
  setup do
    @order = orders(:active_vm_order) rescue nil
    unless @order
      # Create fixtures dynamically if not available
      user = User.create!(email: "test_expire@example.com", password: "password", first_name: "Test", last_name: "Expire")
      @order = Order.create!(user: user, product: products(:vm_product), product_pricing: product_pricings(:vm_pricing), status: 'active')
    end
    
    @vm = Vm.create!(
      order: @order, 
      status: 'active', 
      ip_address: "1.1.1.1", 
      proxmox_vm_id: "100", 
      expires_at: 1.hour.ago
    )
    
    @active_vm = Vm.create!(
      order: @order, 
      status: 'active', 
      ip_address: "2.2.2.2", 
      proxmox_vm_id: "101", 
      expires_at: 1.hour.from_now
    )
  end

  test "terminates expired resources" do
    # Simple stubbing without external libs
    VmProvisioningService.class_eval do
      alias_method :original_cleanup_vm, :cleanup_vm
      def cleanup_vm(*args); end
    end
    
    begin
      perform_enqueued_jobs do
        ExpirationCleanupJob.perform_now
      end
      
      @vm.reload
      # The job terminates the VM (marks as terminated/failed)
      # Assuming terminate! checks 'active' and transitions
      assert ['terminated', 'failed'].include?(@vm.status)
      assert_equal 'expired', @vm.order.reload.status
      
      @active_vm.reload
      assert @active_vm.active?
    ensure
      # Restore original method
      VmProvisioningService.class_eval do
        alias_method :cleanup_vm, :original_cleanup_vm
        remove_method :original_cleanup_vm
      end
    end
  end
end

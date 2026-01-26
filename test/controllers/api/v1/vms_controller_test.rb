require "test_helper"

class Api::V1::VmsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @reseller = resellers(:reseller_one)
    Wallet.find_or_create_by!(owner: @reseller) { |w| w.balance = 100.0 }
  end

  test "should list VMs" do
    get "/api/v1/vms", headers: auth_header(@reseller)
    
    assert_response :success
    assert json_response.key?("vms") || json_response.is_a?(Array)
  end

  test "should fail without authentication" do
    get "/api/v1/vms"
    
    assert_response :unauthorized
  end

  test "should get VM status" do
    # Create a VM for the reseller
    order = Order.create!(
      reseller: @reseller,
      product: products(:vm_product),
      product_pricing: product_pricings(:vm_pricing),
      status: "active"
    )
    
    vm = Vm.create!(
      order: order,
      status: "active",
      ip_address: "10.0.0.1",
      proxmox_vm_id: "100"
    )
    
    get "/api/v1/vms/#{vm.id}", headers: auth_header(@reseller)
    
    assert_response :success
  end
end

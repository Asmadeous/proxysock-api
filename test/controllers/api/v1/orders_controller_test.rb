require "test_helper"

class Api::V1::OrdersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @reseller = resellers(:reseller_one)
    Wallet.find_or_create_by!(owner: @reseller) do |w|
      w.balance = 500.0
    end
    @reseller.wallet.update!(balance: 500.0)
    
    @vm_product = products(:vm_product)
    @pricing = product_pricings(:vm_pricing)
  end

  test "should list orders" do
    get "/api/v1/orders", headers: auth_header(@reseller)
    
    assert_response :success
    assert json_response.key?("orders")
  end

  test "should create VM order" do
    assert_difference "Order.count", 1 do
      post "/api/v1/orders", 
        params: { product_id: @vm_product.id },
        headers: auth_header(@reseller)
    end
    
    assert_response :created
    assert_not_nil json_response["id"]
  end

  test "should fail to create order for non-VM product" do
    proxy_product = products(:proxy_product)
    
    post "/api/v1/orders",
      params: { product_id: proxy_product.id },
      headers: auth_header(@reseller)
    
    # Should return 404 because proxy is not available for resellers
    assert_response :not_found
  end

  test "should fail without authentication" do
    get "/api/v1/orders"
    
    assert_response :unauthorized
  end

  test "should get order credentials" do
    # Create an active order with a VM
    order = Order.create!(
      reseller: @reseller,
      product: @vm_product,
      product_pricing: @pricing,
      status: "active"
    )
    
    vm = Vm.create!(
      order: order,
      status: "active",
      ip_address: "192.168.1.100",
      ssh_username: "root",
      ssh_password: "secret123",
      ssh_port: 22
    )
    
    get "/api/v1/orders/#{order.id}/credentials", headers: auth_header(@reseller)
    
    assert_response :success
    assert_equal "vm", json_response["type"]
    assert_equal "192.168.1.100", json_response["ip_address"]
  end
end

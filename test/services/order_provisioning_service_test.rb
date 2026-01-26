require "test_helper"

class OrderProvisioningServiceTest < ActiveSupport::TestCase
  setup do
    @user = users(:user_one)
    @user_wallet = Wallet.create!(owner: @user, balance: 100.0)
    
    @reseller = resellers(:reseller_one)
    @reseller_wallet = Wallet.create!(owner: @reseller, balance: 500.0)
    
    @vm_product = products(:vm_product)
    @vm_pricing = product_pricings(:vm_pricing)
    
    @proxy_product = products(:proxy_product)
    @proxy_pricing = product_pricings(:proxy_pricing)
  end

  test "should provision VM for user with sufficient balance" do
    order = Order.create!(
      user: @user,
      product: @vm_product,
      product_pricing: @vm_pricing,
      status: "pending"
    )
    
    # Mock VmProvisioningJob
    assert_enqueued_with(job: VmProvisioningJob) do
      service = OrderProvisioningService.new(order, @user)
      assert service.process!
    end
    
    order.reload
    assert order.processing?
    assert_equal 75.0, @user.wallet.reload.balance # 100 - 25
  end

  test "should fail if insufficient balance" do
    @user.wallet.update!(balance: 10.0) # Price is 25.0
    
    order = Order.create!(
      user: @user,
      product: @vm_product,
      product_pricing: @vm_pricing,
      status: "pending"
    )
    
    service = OrderProvisioningService.new(order, @user)
    
    assert_raises(StandardError) { service.process! }
    
    order.reload
    assert order.failed?
  end

  test "should provision Proxy for reseller" do
    order = Order.create!(
      reseller: @reseller,
      product: @proxy_product,
      product_pricing: @proxy_pricing,
      status: "pending"
    )
    
    # Mock XProxyService or similar if needed. For now assuming minimal logic or mocking.
    # The service calls XProxyService.new.provision.
    
    mock_proxy_service = Minitest::Mock.new
    mock_proxy_service.expect :provision, true, [Order]
    
    XProxyService.stub :new, mock_proxy_service do
      service = OrderProvisioningService.new(order, @reseller)
      assert service.process!
    end
    
    order.reload
    assert order.active? # Proxies activate immediately
  end
end

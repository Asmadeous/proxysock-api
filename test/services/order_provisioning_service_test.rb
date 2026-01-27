# frozen_string_literal: true

require 'test_helper'

class OrderProvisioningServiceTest < ActiveSupport::TestCase
  include ActiveJob::TestHelper
  
  setup do
    @user = users(:one)
    @user_wallet = Wallet.create!(owner: @user)
    txn = Transaction.create!(transactable: @user, reference: @user, amount: 100.0, transaction_type: 'credit', status: 'success', currency: 'USD', description: 'Init')
    @user_wallet.credit!(100.0, 'Init', {}, txn)

    @reseller = resellers(:one)
    @reseller_wallet = Wallet.create!(owner: @reseller)
    txn_r = Transaction.create!(transactable: @reseller, reference: @reseller, amount: 500.0, transaction_type: 'credit', status: 'success', currency: 'USD', description: 'Init')
    @reseller_wallet.credit!(500.0, 'Init', {}, txn_r)

    @vm_product = products(:one)
    @vm_pricing = product_pricings(:one)

    @proxy_product = products(:two)
    @proxy_pricing = product_pricings(:two)
  end

  test 'should provision VM for user with sufficient balance' do
    order = Order.create!(
      orderable: @user,
      product: @vm_product,
      product_pricing: @vm_pricing,
      status: 'pending'
    )

    # Mock VmProvisioningJob
    assert_enqueued_with(job: VmProvisioningJob) do
      service = OrderProvisioningService.new(order, @user)
      assert service.process!
    end

    order.reload
    assert order.processing?
    @user.wallet.reload
    assert_equal 75.0, @user.wallet.balance # 100 - 25
  end

  test 'should fail if insufficient balance' do
    # User has 100.0. Reduce to 1.0 (Debit 99.0)
    txn = Transaction.create!(transactable: @user, reference: @user, amount: 99.0, transaction_type: 'debit', status: 'success', currency: 'USD')
    @user.wallet.debit!(99.0, 'Reduce balance', {}, txn)
    
    order = Order.create!(
      orderable: @user,
      product: @vm_product,
      product_pricing: @vm_pricing,
      status: 'pending'
    )

    order.reload
    # Reload user to ensure wallet association is fresh
    @user.reload
    
    service = OrderProvisioningService.new(order, @user)

    begin
      service.process!
      flunk("Should have raised StandardError/ProvisioningError")
    rescue StandardError => e
      assert true
      assert_match /Insufficient balance/, e.message
    end
    order.reload
    assert order.failed?
  end

  test 'should provision Proxy for reseller' do
    order = Order.create!(
      orderable: @reseller,
      product: @proxy_product,
      product_pricing: @proxy_pricing,
      status: 'pending'
    )

    # Mock ProxySyncService
    ProxySyncService.any_instance.stubs(:sync_all)

    # We need to stub provision_proxy! or the internal helpers if they make external calls
    # But for this test, we just want to ensure it runs without error if mocked
    
    # Mock XProxyService if provider is xproxy, or inventory logic
    # Since product provider_type is 'xproxy' (based on create_proxy_product helper def),
    # it calls provision_proxy! -> XProxyService.new.provision
    
    XProxyService.any_instance.expects(:provision).with(order).returns(true)

    assert_difference 'MobileProxyOrder.count', 0 do # Proxy product doesn't create MobileProxyOrder unless logic changes? 
      # Actually create_proxy_product makes 'proxy' type, 'xproxy' provider.
      # provision_proxy! calls XProxyService.
      # It does NOT create MobileProxyOrder record?
      # Let's check logic:
      # when 'xproxy' -> XProxyService.new.provision(@order)
      # So count shouldn't change unless XProxyService creates it.
      
      OrderProvisioningService.new(order, @reseller).process!
    end
    
    order.reload
    assert order.active? # Proxies activate immediately
  end
end

# frozen_string_literal: true

require 'test_helper'

class OrderProvisioningServiceTest < ActiveSupport::TestCase
  include ActiveJob::TestHelper

  setup do
    ActiveJob::Base.queue_adapter = :test
    @user = create_user_with_balance(100.0)
    @user_wallet = @user.wallet

    @reseller = create_reseller_with_balance(500.0)
    @reseller_wallet = @reseller.wallet

    # Mock MyProxyApiClient
    @proxy_client_mock = mock('MyProxyApiClient')
    MyProxyApiClient.stubs(:new).returns(@proxy_client_mock)
    @proxy_client_mock.stubs(:place_order).returns({ 'data' => { 'order_id' => 'test_order_123' } })
    @proxy_client_mock.stubs(:view_order).returns({ 'data' => { 'ip' => '1.2.3.4', 'port' => 8080, 'username' => 'u', 'password' => 'p' } })
    @proxy_client_mock.stubs(:get_or_create_user).returns('user123')
    @proxy_client_mock.stubs(:reseller_user_id).returns('37199')

    @vm_product = products(:one)
    @vm_pricing = product_pricings(:pricing_one)

    @proxy_product = products(:two)
    @proxy_pricing = product_pricings(:pricing_two)
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
    low_balance_user = create_user_with_balance(5.0) # 5.0 < 25.0 (VM price)
    order = Order.create!(
      orderable: low_balance_user,
      product: @vm_product,
      product_pricing: @vm_pricing,
      status: 'pending'
    )

    service = OrderProvisioningService.new(order, low_balance_user)

    error = assert_raises(OrderProvisioningService::ProvisioningError) do
      service.process!
    end
    assert_match(/Insufficient balance/, error.message)
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

    # Proxy provisioning test

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

  test 'MeiSIM order with unknown outcome tells staff to review instead of reporting success' do
    product = Product.create!(name: 'France 2 GB', product_type: 'esim', provider: 'meisim', provider_type: 'meisim',
                              provider_product_id: 'fr-2gb', available_to: 'both',
                              product_category: product_categories(:three), metadata: { 'meisim_line' => 'travel' })
    pricing = ProductPricing.create!(product: product, currency: 'USD', selling_price: 3.99,
                                     reseller_selling_price: 3.99, user_selling_price: 4.79, active: true)
    order = Order.create!(orderable: @user, product: product, product_pricing: pricing, status: 'pending')
    MeisimService.any_instance.stubs(:create_order).raises(MeisimService::Error.new('Net::ReadTimeout'))
    SlackNotifierService.stubs(:notify)
    Employee.where(id: employees(:one).id).update_all(role: 'admin', active: true)
    titles = []
    NotificationService.stubs(:notify).with { |args| titles << args[:title] }

    assert OrderProvisioningService.new(order, @user).process!

    assert order.reload.processing?
    assert_includes titles, 'Order Needs Review'
    assert_not_includes titles, 'Order Completed'
  end
end

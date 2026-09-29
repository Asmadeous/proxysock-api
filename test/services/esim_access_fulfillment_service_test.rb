# frozen_string_literal: true

require 'test_helper'

class EsimAccessFulfillmentServiceTest < ActiveSupport::TestCase
  PROFILE = {
    'iccid' => '89852000263311110009', 'ac' => 'LPA:1$rsp.example.com$ABC', 'qrCodeUrl' => 'https://static.example.com/qr.png',
    'esimTranNo' => 'T1', 'orderNo' => 'B1', 'totalVolume' => 1_073_741_824, 'expiredTime' => '2026-12-01T00:00:00+0000'
  }.freeze

  setup do
    @user = create_user_with_balance(0)
    product = Product.create!(name: 'Malaysia 1GB 7Days', product_type: 'esim', provider: 'esim_access', provider_type: 'esim_access',
                              available_to: 'both', product_category: product_categories(:three))
    pricing = ProductPricing.create!(product: product, currency: 'USD', selling_price: 2, active: true)
    @order = Order.create!(orderable: @user, product: product, product_pricing: pricing, quantity: 1,
                           status: 'processing', total_amount: 2)
    @esim_order = EsimOrder.create!(order: @order, esim_provider: 'esim_access', status: 'pending_provisioning',
                                    provider_order_no: 'B1', package_code: 'JC1', duration_days: 7, metadata: {})
    @client = mock('esim_access')
  end

  test 'saves the profiles, completes the order and emails the customer once' do
    @client.expects(:fetch_profiles_by_order).with('B1').returns([PROFILE])
    EsimMailer.expects(:with).once.returns(stub(delivery_email: stub(deliver_later: true)))

    assert EsimAccessFulfillmentService.new(@esim_order, client: @client).fulfill!

    assert_equal 'completed', @esim_order.reload.status
    assert_equal 'active', @order.reload.status
    esim = @esim_order.esims.sole
    assert_equal ['LPA:1$rsp.example.com$ABC', 1_073_741_824], [esim.activation_code, esim.data_total_bytes]

    @client.expects(:fetch_profiles_by_order).never
    assert EsimAccessFulfillmentService.new(@esim_order, client: @client).fulfill!
  end

  test 'waits while a profile has no activation code yet' do
    @client.expects(:fetch_profiles_by_order).returns([PROFILE.merge('ac' => nil)])

    assert_not EsimAccessFulfillmentService.new(@esim_order, client: @client).fulfill!
    assert_equal 'pending_provisioning', @esim_order.reload.status
    assert_empty @esim_order.esims
  end

  test 'the poll job completes missed orders and alerts on stuck ones' do
    @esim_order.update_columns(created_at: 3.hours.ago)
    EsimAccessService.stubs(:new).returns(@client)
    @client.stubs(:fetch_profiles_by_order).returns([])
    SlackNotifierService.expects(:notify).with(:provisioning_failed, @order, has_key(:error)).once

    EsimAccessOrderPollJob.perform_now
    EsimAccessOrderPollJob.perform_now

    assert @esim_order.reload.metadata['stale_alerted']
  end
end

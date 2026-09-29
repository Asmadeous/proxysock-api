# frozen_string_literal: true

require 'test_helper'

class MeisimOrderServiceTest < ActiveSupport::TestCase
  LINE = {
    'line' => 1,
    'status' => 'delivered',
    'activation_code' => 'LPA:1$SMDP.EXAMPLE$ABC123',
    'smdp' => 'SMDP.EXAMPLE',
    'matching_id' => 'ABC123',
    'iccid' => '89049032000001000096650386218347',
    'phone_number' => nil,
    'qr_png_url' => 'https://api.meisimusa.com/qr?size=480&text=x',
    'install_ios_url' => 'https://esimsetup.apple.com/x'
  }.freeze

  setup do
    @user = create_user_with_balance(100.0)
    @product = Product.create!(
      name: 'France 2 GB', product_type: 'esim', provider: 'meisim', provider_type: 'meisim',
      provider_product_id: 'fr-2gb', available_to: 'both', product_category: product_categories(:three),
      metadata: { 'meisim_line' => 'travel', 'esim_type' => 'data_only', 'countries' => ['FR'], 'validity_days' => 15,
                  'data_limit' => '2', 'data_unit' => 'GB' }
    )
    @pricing = ProductPricing.create!(product: @product, currency: 'USD', selling_price: 3.99,
                                      reseller_selling_price: 3.99, user_selling_price: 4.79, active: true)
    @order = Order.create!(orderable: @user, product: @product, product_pricing: @pricing,
                           quantity: 1, status: 'processing', total_amount: 4.79)
    @client = mock('meisim')
    SlackNotifierService.stubs(:notify)
    EsimMailer.stubs(:with).returns(stub(delivery_email: stub(deliver_later: true)))
  end

  def service
    MeisimOrderService.new(@order, client: @client)
  end

  def created(activation, extra = {})
    { 'ok' => true, 'orderId' => 'mo-1', 'shortId' => 'MM-AB12CD', 'unitPriceUsd' => 2.07,
      'totalUsd' => 2.07, 'activation' => activation }.merge(extra)
  end

  def remote(state:, lines:)
    { 'ok' => true, 'orderId' => 'mo-1', 'state' => state, 'lines' => lines }
  end

  test 'delivered order creates the eSIM, activates the order, and records cost' do
    support = Mail::Address.new(ApplicationMailer.default[:from]).address
    @client.expects(:create_order).with(has_entries(product_id: 'fr-2gb', customer_email: support, quantity: 1))
           .returns(created('delivered'))
    @client.expects(:order).with('mo-1').returns(remote(state: 'fulfilled', lines: [LINE]))
    EsimMailer.expects(:with).once.returns(stub(delivery_email: stub(deliver_later: true)))

    esim_order = service.place!

    assert_equal 'completed', esim_order.status
    assert_equal 'meisim', esim_order.esim_provider
    assert_equal 'active', @order.reload.status
    esim = esim_order.esims.sole
    assert_equal LINE['iccid'], esim.iccid
    assert_equal LINE['activation_code'], esim.activation_code
    assert_equal LINE['qr_png_url'], esim.qr_code_url
    assert_equal 'ABC123', esim.metadata['matching_id']
    # The plan's 2 GB is recorded so the eSIM pages can show it.
    assert_equal 2.gigabytes, esim.data_total_bytes
    assert_equal 2, esim_order.data_amount_gb
    assert_equal 15, esim_order.duration_days
    assert_equal BigDecimal('2.07'), @pricing.reload.cost_price
  end

  test 'pending order waits for polling' do
    @client.expects(:create_order).returns(created('pending'))
    @client.expects(:order).never

    esim_order = service.place!

    assert_equal 'pending_provisioning', esim_order.status
    assert_equal 'processing', @order.reload.status
    assert_empty esim_order.esims
  end

  test 'failed activation raises so the customer is refunded' do
    @client.expects(:create_order).returns(created('failed', 'failure' => { 'meaning' => 'operator rejected', 'refunded' => true }))
    SlackNotifierService.expects(:notify).never

    error = assert_raises(MeisimOrderService::OrderFailed) { service.place! }

    assert_includes error.message, 'operator rejected'
    assert_equal 'failed', @order.esim_order.status
  end

  test 'failed activation not refunded by MeiSIM alerts staff' do
    @client.expects(:create_order).returns(created('failed', 'failure' => { 'reason' => 'x', 'refunded' => false }))
    SlackNotifierService.expects(:notify).once

    assert_raises(MeisimOrderService::OrderFailed) { service.place! }
  end

  test '402 raises and alerts staff to top up' do
    @client.expects(:create_order).raises(MeisimService::Error.new('Payment required', status: 402))
    SlackNotifierService.expects(:notify).with(:provisioning_failed, @order, has_entry(error: regexp_matches(/balance/)))

    assert_raises(MeisimOrderService::OrderFailed) { service.place! }
    assert_nil @order.esim_order
  end

  test 'other 4xx raises' do
    @client.expects(:create_order).raises(MeisimService::Error.new('Bad Request: imei required', status: 400))

    assert_raises(MeisimOrderService::OrderFailed) { service.place! }
  end

  test 'timeout holds the order for review instead of refunding' do
    @client.expects(:create_order).raises(MeisimService::Error.new('Net::ReadTimeout'))
    SlackNotifierService.expects(:notify).once

    assert_nil service.place!

    @order.reload
    assert_equal 'processing', @order.status
    assert @order.metadata['meisim_review_required']
    assert_nil @order.esim_order
  end

  test 'lookup failure after a paid order leaves it pending, never refunds' do
    @client.expects(:create_order).returns(created('delivered'))
    @client.expects(:order).raises(MeisimService::Error.new('Net::ReadTimeout'))

    esim_order = service.place!

    assert_equal 'pending_provisioning', esim_order.status
    assert_equal 'processing', @order.reload.status
  end

  test 'refresh completes a pending order once every line is delivered' do
    @client.expects(:create_order).returns(created('pending'))
    esim_order = service.place!
    @client.expects(:order).returns(remote(state: 'fulfilled', lines: [LINE]))

    service.refresh!(esim_order)

    assert_equal 'completed', esim_order.reload.status
    assert_equal 'active', @order.reload.status
  end

  test 'refresh leaves partially delivered orders pending' do
    @client.expects(:create_order).returns(created('pending'))
    esim_order = service.place!
    @client.expects(:order).returns(remote(state: 'processing', lines: [LINE, LINE.merge('line' => 2, 'status' => 'pending')]))

    service.refresh!(esim_order)

    assert_equal 'pending_provisioning', esim_order.reload.status
    assert_empty esim_order.esims
  end

  test 'refresh fails and refunds a cancelled order' do
    @client.expects(:create_order).returns(created('pending'))
    esim_order = service.place!
    @client.expects(:order).returns(remote(state: 'cancelled', lines: []))
    wallet = @user.wallets.find_by(wallet_type: 'main')
    payment = Transaction.create!(transactable: @user, reference: @order, amount: 4.79, transaction_type: 'debit',
                                  status: 'success', currency: 'USD', payment_gateway: 'wallet',
                                  description: 'Order payment')
    wallet.debit!(4.79, 'Order payment', { order_id: @order.id }, payment)
    balance_before = wallet.reload.balance

    service.refresh!(esim_order)

    assert_equal 'failed', esim_order.reload.status
    assert_equal 'refunded', @order.reload.status
    assert_in_delta balance_before + 4.79, wallet.reload.balance, 0.001
  end

  test 'EsimProvisioningService routes meisim products here' do
    MeisimOrderService.any_instance.expects(:place!).once

    EsimProvisioningService.new(@order).provision!
  end

  test 'US carrier orders send device details and store the phone number' do
    us = Product.create!(name: 'AT&T', product_type: 'esim', provider: 'meisim', provider_product_id: 'p3:2:629',
                         available_to: 'both', product_category: product_categories(:three),
                         metadata: { 'meisim_line' => 'us_prepaid', 'network' => 'AT&T Prepaid' })
    order = Order.create!(orderable: @user, product: us, product_pricing: @pricing, status: 'processing',
                          metadata: { 'imei' => '356938035643809', 'eid' => '89049032000001000000000000000001' })
    @client.expects(:create_order).with(has_entries(product_id: 'p3:2:629', imei: '356938035643809',
                                                    eid: '89049032000001000000000000000001', address: nil))
           .returns(created('delivered'))
    @client.expects(:order).returns(remote(state: 'fulfilled', lines: [LINE.merge('phone_number' => '3415128315',
                                                                                  'sim_pin' => '1234')]))

    esim = MeisimOrderService.new(order, client: @client).place!.esims.sole

    assert_equal '3415128315', esim.msisdn
    assert esim.has_phone_number
    assert_equal '1234', esim.pin1
  end
end

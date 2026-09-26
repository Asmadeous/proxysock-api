# frozen_string_literal: true

require 'test_helper'

class EsimTopupServiceTest < ActiveSupport::TestCase
  setup do
    @user = create_user_with_balance(100.0)
    @product = Product.create!(
      name: 'AT&T Unlimited', product_type: 'esim', provider: 'meisim', provider_type: 'meisim',
      provider_product_id: 'man:att_unl', available_to: 'both', product_category: product_categories(:three),
      metadata: { 'meisim_line' => 'us_prepaid', 'esim_type' => 'voice_data' }
    )
    @pricing = ProductPricing.create!(product: @product, currency: 'USD', selling_price: 30, reseller_selling_price: 30,
                                      user_selling_price: 30, active: true)
    @order = Order.create!(orderable: @user, product: @product, product_pricing: @pricing, quantity: 1,
                           status: 'active', total_amount: 30,
                           metadata: { 'imei' => '356938035643809', 'eid' => '89049032000001000000000000000001' })
    SlackNotifierService.stubs(:notify)
    AdminMailer.stubs(:esim_topup_request).returns(stub(deliver_later: true))
  end

  def service
    EsimTopupService.new(@order, @user)
  end

  def balance
    @user.wallet.reload.balance
  end

  test 'one-time $10 top-up costs $15, debits the balance, and alerts staff' do
    SlackNotifierService.expects(:notify).with(:esim_topup_requested, instance_of(EsimTopup))
    AdminMailer.expects(:esim_topup_request).returns(stub(deliver_later: true))

    topup = service.buy_once!('10')

    assert_predicate topup, :pending?
    assert_equal BigDecimal('10'), topup.topup_value
    assert_equal BigDecimal('15'), topup.price
    assert_match(/\ATOP-[0-9A-F]{12}\z/, topup.reference)
    assert_equal BigDecimal('85'), balance
    assert_equal topup, topup.charge_transaction.reference
  end

  test 'one-time top-up only offers the listed amounts' do
    assert_raises(EsimTopupService::InvalidAmount) { service.buy_once!(25) }
    assert_equal BigDecimal('100'), balance
  end

  test 'short balance charges nothing and records nothing' do
    poor = create_user_with_balance(5.0)
    @order.update!(orderable: poor)

    assert_raises(EsimTopupService::InsufficientBalance) { EsimTopupService.new(@order, poor).buy_once!(10) }
    assert_empty EsimTopup.all
    assert_equal BigDecimal('5'), poor.wallet.reload.balance
  end

  test 'only active MeiSIM phone lines can be topped up' do
    @order.update!(status: 'expired')
    assert_raises(EsimTopupService::NotEligible) { service.buy_once!(10) }

    @order.update!(status: 'active')
    @product.update!(metadata: { 'meisim_line' => 'travel' })
    assert_raises(EsimTopupService::NotEligible) { service.buy_once!(10) }
  end

  test 'subscribing charges the chosen amount now, with no markup, and replaces an earlier subscription' do
    first = service.subscribe!(20)
    assert_equal BigDecimal('20'), first.price
    assert_equal BigDecimal('80'), balance

    second = service.subscribe!(10)

    assert_predicate first.reload, :cancelled?
    assert_predicate second, :active?
    assert_equal BigDecimal('10'), second.price
    assert_in_delta 1.month.from_now, second.next_charge_at, 5
    assert_equal 2, @order.esim_topups.where.not(esim_topup_subscription_id: nil).count
    assert_equal BigDecimal('70'), balance
  end

  test 'subscription must be a whole amount of at least $10' do
    assert_raises(EsimTopupService::InvalidAmount) { service.subscribe!(5) }
    assert_raises(EsimTopupService::InvalidAmount) { service.subscribe!('12.5') }
    assert_empty EsimTopupSubscription.all
  end

  test 'failed first charge leaves no subscription behind' do
    poor = create_user_with_balance(5.0)
    @order.update!(orderable: poor)

    assert_raises(EsimTopupService::InsufficientBalance) { EsimTopupService.new(@order, poor).subscribe!(10) }
    assert_empty EsimTopupSubscription.all
  end

  test 'renewal charges the month and moves the next charge on' do
    subscription = service.subscribe!(10)
    due_at = subscription.next_charge_at

    EsimTopupService.renew!(subscription)

    assert_predicate subscription.reload, :active?
    assert_equal due_at + 1.month, subscription.next_charge_at
    assert_equal BigDecimal('80'), balance
  end

  test 'renewal with a short balance goes past due, then recovers once topped up' do
    subscription = service.subscribe!(60)
    assert_equal BigDecimal('40'), balance

    EsimTopupService.renew!(subscription)
    assert_predicate subscription.reload, :past_due?
    assert_equal 1, subscription.esim_topups.count

    txn = Transaction.create!(transactable: @user, reference: @user, amount: 100, transaction_type: 'credit',
                              status: 'success', currency: 'USD', description: 'Deposit')
    @user.wallet.credit!(100, 'Deposit', {}, txn)
    EsimTopupService.renew!(subscription)

    assert_predicate subscription.reload, :active?
    assert_equal 2, subscription.esim_topups.count
  end

  test 'renewal cancels the subscription once the line is no longer active' do
    subscription = service.subscribe!(10)
    @order.update!(status: 'expired')

    EsimTopupService.renew!(subscription)

    assert_predicate subscription.reload, :cancelled?
    assert_equal BigDecimal('90'), balance
  end

  test 'staff can complete a top-up, or cancel it and refund the customer' do
    done = service.buy_once!(10)
    refunded = service.buy_once!(10)

    EsimTopupService.complete!(done, note: 'Applied in portal')
    EsimTopupService.cancel_and_refund!(refunded, note: 'Carrier rejected')

    assert_predicate done.reload, :completed?
    assert_equal 'Applied in portal', done.admin_note
    assert_predicate refunded.reload, :cancelled?
    assert_equal BigDecimal('85'), balance
    assert_raises(EsimTopupService::InvalidAmount) { EsimTopupService.cancel_and_refund!(refunded) }
    assert_equal BigDecimal('85'), balance
  end
end

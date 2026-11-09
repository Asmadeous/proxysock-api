# frozen_string_literal: true

require 'test_helper'

class BachsWebhookServiceTest < ActiveSupport::TestCase
  include ActiveJob::TestHelper

  setup do
    @user = create_user_with_balance(0)
    @client = mock('BachsService')
  end

  def completed_event(checkout_id = 'chk_1')
    { 'id' => 'evt_1', 'type' => 'checkout.completed',
      'data' => { 'checkout_id' => checkout_id, 'payment_status' => 'paid' } }
  end

  def checkout(reference, amount, status: 'completed', currency: 'USD')
    { 'checkout_id' => 'chk_1', 'status' => status, 'reference' => reference, 'amount' => amount,
      'currency' => currency, 'metadata' => {},
      'charge' => { 'payment_id' => 'ch_1', 'status' => 'succeeded', 'amount' => amount, 'amount_paid' => amount,
                    'amount_remaining' => '0.00', 'currency' => currency } }
  end

  def process(event = completed_event)
    BachsWebhookService.new(event, client: @client).process!
  end

  def pending_deposit(amount)
    Deposit.create!(depositable: @user, amount: amount, gateway: 'bachs', status: 'pending',
                    metadata: { 'transaction_ref' => 'DEPbachs1', 'bachs_checkout_id' => 'chk_1' })
  end

  test 'credits a deposit once when the event is delivered twice' do
    deposit = pending_deposit(20)
    @client.stubs(:checkout).with('chk_1').returns(checkout('DEPbachs1', '20.00'))

    2.times { process }

    assert_equal 'completed', deposit.reload.status
    assert_equal 'ch_1', deposit.metadata['bachs_charge_id']
    assert_in_delta 20.0, @user.wallet.reload.balance
  end

  test 'does not credit a payment smaller than the deposit and alerts staff' do
    deposit = pending_deposit(20)
    @client.stubs(:checkout).returns(checkout('DEPbachs1', '10.00'))

    assert_enqueued_with(job: SlackNotifyJob) { process }

    assert_equal 'pending', deposit.reload.status
    assert_in_delta 0.0, @user.wallet.reload.balance
  end

  test 'holds a short payment Bachs accepted as final and alerts staff' do
    deposit = pending_deposit(20)
    short = checkout('DEPbachs1', '20.00')
    short['charge'].merge!('status' => 'accepted', 'amount_paid' => '12.00')
    @client.stubs(:checkout).returns(short)

    assert_enqueued_with(job: SlackNotifyJob) { process }

    assert_equal 'pending', deposit.reload.status
    assert_in_delta 0.0, @user.wallet.reload.balance
  end

  test 'asks for redelivery while the checkout is not completed' do
    pending_deposit(20)
    @client.stubs(:checkout).returns(checkout('DEPbachs1', '20.00', status: 'open'))

    assert_raises(BachsWebhookService::NotReady) { process }
  end

  test 'ignores free checkouts and events from sub-accounts' do
    @client.expects(:checkout).never

    process(completed_event.deep_merge('data' => { 'payment_status' => 'no_payment_required' }))
    process(completed_event.merge('account' => 'acct_sub'))
  end

  test 'completes a cart checkout once and keeps the Bachs payment id' do
    session = CheckoutSession.create!(orderable: @user, total_amount: 30, payment_method: 'bachs', metadata: {})
    reference = session.generate_reference!
    @client.stubs(:checkout).returns(checkout(reference, '30.00'))

    assert_difference -> { Transaction.where(reference: session).count }, 1 do
      2.times { process }
    end

    session.reload
    assert session.completed?
    assert_equal 'ch_1', session.metadata['bachs_charge_id']
  end

  test 'provisions a single order once, without debiting the wallet' do
    order = Order.create!(orderable: @user, product: products(:two), product_pricing: product_pricings(:pricing_two),
                          status: 'pending')
    order.await_payment!
    @client.stubs(:checkout).returns(checkout("ORD#{order.id.delete('-')}ab12cd34", format('%.2f', order.total_amount)))

    assert_enqueued_jobs 1, only: OrderProvisioningJob do
      2.times { process }
    end
    assert_enqueued_with(job: OrderProvisioningJob, args: [order.id, @user.id, 'User', { skip_payment: true }])
    assert_equal 'bachs', order.reload.metadata['paid_via']
  end

  test 'alerts staff about disputes and failed refunds' do
    assert_enqueued_jobs 2, only: SlackNotifyJob do
      process({ 'type' => 'dispute.created',
                'data' => { 'dispute_id' => 'dsp_1', 'status' => 'needs_response', 'response_deadline_at' => '2026-11-01T00:00:00Z' } })
      process({ 'type' => 'refund.failed', 'data' => { 'refund_id' => 'rfnd_1', 'charge_id' => 'ch_1' } })
    end
  end
end

# frozen_string_literal: true

require 'test_helper'

class RefundServiceTest < ActiveSupport::TestCase
  setup do
    @user = create_user_with_balance(0)
    @session = CheckoutSession.create!(orderable: @user, total_amount: 20, payment_method: 'bachs', status: 'paid',
                                       metadata: { 'bachs_charge_id' => 'ch_1' })
  end

  def failed_order
    order = Order.create!(orderable: @user, product: products(:two), product_pricing: product_pricings(:pricing_two),
                          checkout_session: @session, status: 'pending')
    order.fail!
    order
  end

  test 'refunds a failed Bachs order to the card and records the refund' do
    order = failed_order
    BachsService.any_instance.expects(:create_refund)
                .with(has_entries(charge_id: 'ch_1', reference: "REF#{order.id.delete('-')}", amount: order.total_amount))
                .returns({ 'refund_id' => 'rfnd_1', 'status' => 'processing' })

    RefundService.new(order).process!

    assert order.reload.refunded?
    assert_equal 'rfnd_1', @session.reload.metadata['bachs_refund_id']
  end

  test 'refuses a second Bachs refund on the same payment' do
    @session.update!(metadata: @session.metadata.merge('bachs_refund_id' => 'rfnd_1'))
    order = failed_order
    BachsService.any_instance.expects(:create_refund).never

    assert_raises(RefundService::RefundError) { RefundService.new(order).process! }
    assert order.reload.failed?
  end

  test 'turns a Bachs refusal into a RefundError' do
    order = failed_order
    BachsService.any_instance.stubs(:create_refund)
                .raises(BachsService::Error.new('Refunds are not supported for this charge', status: 400))

    error = assert_raises(RefundService::RefundError) { RefundService.new(order).process! }
    assert_includes error.message, 'not supported'
  end
end

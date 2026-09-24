# frozen_string_literal: true

require 'test_helper'

class MeisimOrderPollJobTest < ActiveJob::TestCase
  setup do
    user = create_user_with_balance(0)
    product = Product.create!(name: 'JP 1GB', product_type: 'esim', provider: 'meisim', provider_product_id: 'jp-1',
                              available_to: 'both', product_category: product_categories(:three))
    pricing = ProductPricing.create!(product: product, currency: 'USD', selling_price: 2, active: true)
    @order = Order.create!(orderable: user, product: product, product_pricing: pricing, status: 'processing',
                           total_amount: 2.4)
    @esim_order = EsimOrder.create!(order: @order, esim_provider: 'meisim', status: 'pending_provisioning',
                                    provider_order_no: 'mo-9', metadata: {})
    SlackNotifierService.stubs(:notify)
  end

  test 'refreshes pending MeiSIM orders' do
    MeisimOrderService.any_instance.expects(:refresh!).with(@esim_order)

    MeisimOrderPollJob.perform_now
  end

  test 'alerts once when an order stays pending past 24 hours' do
    MeisimOrderService.any_instance.stubs(:refresh!)
    @esim_order.update_columns(created_at: 25.hours.ago)
    SlackNotifierService.expects(:notify).once

    2.times { MeisimOrderPollJob.perform_now }

    assert @esim_order.reload.metadata['stale_alerted']
  end

  test 'one failing order does not stop the others' do
    other = EsimOrder.create!(order: @order, esim_provider: 'meisim', status: 'pending_provisioning',
                              provider_order_no: 'mo-10', metadata: {})
    MeisimOrderService.any_instance.expects(:refresh!).twice.raises(MeisimService::Error.new('boom')).then.returns(nil)

    MeisimOrderPollJob.perform_now

    assert other.reload
  end
end

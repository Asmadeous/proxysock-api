# frozen_string_literal: true

require 'test_helper'

class MeisimUsageSyncJobTest < ActiveJob::TestCase
  setup do
    user = create_user_with_balance(0)
    product = Product.create!(name: 'JP 1GB', product_type: 'esim', provider: 'meisim', provider_product_id: 'jp-1',
                              available_to: 'both', product_category: product_categories(:three))
    pricing = ProductPricing.create!(product: product, currency: 'USD', selling_price: 2, active: true)
    order = Order.create!(orderable: user, product: product, product_pricing: pricing, status: 'active')
    travel = EsimOrder.create!(order: order, esim_provider: 'meisim', status: 'completed', provider_order_no: 'mo-1',
                               metadata: { 'meisim_line' => 'travel' })
    us = EsimOrder.create!(order: order, esim_provider: 'meisim', status: 'completed', provider_order_no: 'mo-2',
                           metadata: { 'meisim_line' => 'us_prepaid' })
    @esim = travel.esims.create!(esim_provider: 'meisim', iccid: '8901', status: 'active', metadata: { 'line' => 1 })
    us.esims.create!(esim_provider: 'meisim', iccid: '8902', status: 'active', metadata: { 'line' => 1 })
  end

  test 'updates usage for travel eSIMs only' do
    client = mock('meisim')
    client.expects(:usage).once.with('mo-1', line: 1).returns(
      { 'data_total_mb' => 1000, 'data_used_mb' => 250, 'expires_at' => '2026-10-01T00:00:00Z', 'status' => 'active' }
    )

    MeisimUsageSyncJob.perform_now(client: client)

    @esim.reload
    assert_equal 1000.megabytes, @esim.data_total_bytes
    assert_equal 250.megabytes, @esim.data_used_bytes
    assert_equal 'active', @esim.esim_status
  end

  test 'marks expired eSIMs' do
    client = stub(usage: { 'data_total_mb' => 1000, 'data_used_mb' => 1000, 'status' => 'expired' })

    MeisimUsageSyncJob.perform_now(client: client)

    assert_equal 'expired', @esim.reload.status
  end
end

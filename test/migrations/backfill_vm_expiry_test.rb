# frozen_string_literal: true

require 'test_helper'
require Rails.root.join('db/migrate/20260929120000_backfill_vm_expiry')

class BackfillVmExpiryTest < ActiveSupport::TestCase
  test 'gives active VMs without an expiry the period they were bought with' do
    order = Order.create!(orderable: resellers(:one), product: products(:one), product_pricing: product_pricings(:pricing_one),
                          status: 'active', metadata: { 'duration_days' => 90 })
    vm_order = VmOrder.create!(order: order)
    quarterly = Vm.create!(vm_order: vm_order, status: 'active', vm_type: 'shared-cpu', created_at: Time.utc(2026, 3, 1))
    monthly = Vm.create!(status: 'active', vm_type: 'shared-cpu', created_at: Time.utc(2026, 3, 1))
    set = Vm.create!(status: 'active', vm_type: 'shared-cpu', expires_at: Time.utc(2027, 1, 1))

    ActiveRecord::Migration.suppress_messages { BackfillVmExpiry.new.up }

    assert_equal Time.utc(2026, 5, 30), quarterly.reload.expires_at
    assert_equal Time.utc(2026, 3, 31), monthly.reload.expires_at
    assert_equal Time.utc(2027, 1, 1), set.reload.expires_at
  end
end

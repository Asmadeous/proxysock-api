# frozen_string_literal: true

require 'test_helper'

class OrderTest < ActiveSupport::TestCase
  setup do
    @user = users(:one)
    @product = products(:one)
    @pricing = product_pricings(:pricing_one)
  end

  test 'belongs to product' do
    order = Order.new(
      orderable: @user,
      product: @product,
      product_pricing: @pricing,
      status: 'pending'
    )
    assert order.save
    assert_equal @product, order.product
  end

  test 'calculates total amount' do
    order = Order.create!(
      orderable: @user,
      product: @product,
      product_pricing: @pricing,
      status: 'pending'
    )
    assert_equal @pricing.selling_price, order.total_amount
  end

  test 'calculates total with reseller surcharge' do
    @reseller = resellers(:one)
    order = Order.new(
      orderable: @reseller,
      product: @product,
      product_pricing: @pricing,
      status: 'pending'
    )
    order.save!
    # 25.00 * 1.10 = 27.50
    expected = (@pricing.selling_price * @reseller.price_multiplier).round(2)
    assert_equal expected, order.total_amount
  end

  test 'AASM states' do
    order = Order.create!(
      orderable: @user,
      product: @product,
      product_pricing: @pricing,
      status: 'pending'
    )

    assert order.pending?

    order.process!
    assert order.processing?

    order.activate!
    assert order.active?
  end

  test 'has one vm association' do
    order = Order.new
    assert order.respond_to?(:vm)
  end

  test 'has many vpn_accounts association' do
    order = Order.new
    assert order.respond_to?(:vpn_accounts)
  end

  test 'has one esim_order association' do
    order = Order.new
    assert order.respond_to?(:esim_order)
  end
end

require "test_helper"

class OrderTest < ActiveSupport::TestCase
  setup do
    @user = users(:user_one)
    @product = products(:vm_product)
    @pricing = product_pricings(:vm_pricing)
  end

  test "belongs to product" do
    order = Order.new(
      user: @user,
      product: @product,
      product_pricing: @pricing,
      status: "pending"
    )
    assert order.save
    assert_equal @product, order.product
  end

  test "calculates total amount" do
    order = Order.create!(
      user: @user,
      product: @product,
      product_pricing: @pricing,
      status: "pending"
    )
    assert_equal @pricing.selling_price, order.total_amount
  end

  test "calculates total with reseller surcharge" do
    reseller = resellers(:reseller_one)
    order = Order.new(
      reseller: reseller,
      product: @product,
      product_pricing: @pricing,
      status: "pending"
    )
    order.save!
    # 25.00 * 1.10 = 27.50
    expected = (@pricing.selling_price * reseller.price_multiplier).round(2)
    assert_equal expected, order.total_amount
  end

  test "AASM states" do
    order = Order.create!(
      user: @user,
      product: @product,
      product_pricing: @pricing,
      status: "pending"
    )
    
    assert order.pending?
    
    order.process!
    assert order.processing?
    
    order.activate!
    assert order.active?
  end

  test "has one vm association" do
    order = Order.new
    assert order.respond_to?(:vm)
  end

  test "has one vpn_account association" do
    order = Order.new
    assert order.respond_to?(:vpn_account)
  end

  test "has one esim_order association" do
    order = Order.new
    assert order.respond_to?(:esim_order)
  end
end

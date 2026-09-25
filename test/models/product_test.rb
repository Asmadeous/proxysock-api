# frozen_string_literal: true

require 'test_helper'

class ProductTest < ActiveSupport::TestCase
  test 'display_name puts the given price where the MeiSIM list price was' do
    product = Product.new(name: 'Lycamobile · Unlimited International Plan',
                          metadata: { 'name_template' => 'Lycamobile · {price} Unlimited International Plan' })

    assert_equal 'Lycamobile · $22.80 Unlimited International Plan', product.display_name(22.8)
    assert_equal 'Lycamobile · Unlimited International Plan', product.display_name(nil)
    assert_equal 'VPN', Product.new(name: 'VPN').display_name(5)
  end

  test 'valid product types' do
    product = products(:two)
    assert_equal 'proxy', product.product_type

    product = products(:three)
    assert_equal 'esim', product.product_type
  end

  test 'for_resellers scope' do
    vm = products(:one) # available_to: both
    proxy = products(:two) # available_to: ecommerce

    reseller_products = Product.for_resellers
    assert_includes reseller_products, vm
    assert_not_includes reseller_products, proxy
  end

  test 'for_ecommerce scope' do
    all_products = Product.for_ecommerce
    assert all_products.any?
  end

  test 'vms scope' do
    vms = Product.vms
    assert(vms.all? { |p| p.product_type == 'vm' })
  end

  test 'proxies scope' do
    proxies = Product.proxies
    assert(proxies.all? { |p| p.product_type == 'proxy' })
  end

  test 'has many product_pricings' do
    product = products(:one)
    assert product.respond_to?(:product_pricings)
    assert product.product_pricings.any?
  end

  test 'belongs to product_category' do
    product = products(:one)
    assert_not_nil product.product_category
  end
end

require "test_helper"

class ProductTest < ActiveSupport::TestCase
  test "valid product types" do
    product = products(:vm_product)
    assert_equal "vm", product.product_type
    
    product = products(:proxy_product)
    assert_equal "proxy", product.product_type
  end

  test "for_resellers scope" do
    vm = products(:vm_product) # available_to: both
    proxy = products(:proxy_product) # available_to: ecommerce
    
    reseller_products = Product.for_resellers
    assert_includes reseller_products, vm
    assert_not_includes reseller_products, proxy
  end

  test "for_ecommerce scope" do
    all_products = Product.for_ecommerce
    assert all_products.any?
  end

  test "vms scope" do
    vms = Product.vms
    assert vms.all? { |p| p.product_type == "vm" }
  end

  test "proxies scope" do
    proxies = Product.proxies
    assert proxies.all? { |p| p.product_type == "proxy" }
  end

  test "has many product_pricings" do
    product = products(:vm_product)
    assert product.respond_to?(:product_pricings)
    assert product.product_pricings.any?
  end

  test "belongs to product_category" do
    product = products(:vm_product)
    assert_not_nil product.product_category
  end
end

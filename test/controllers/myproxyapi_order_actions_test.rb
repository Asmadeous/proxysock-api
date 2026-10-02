# frozen_string_literal: true

require 'test_helper'

# Customers and resellers restart VPNs, switch mobile rotation and renew MyProxyAPI
# orders through their own APIs.
class MyproxyapiOrderActionsTest < ActionDispatch::IntegrationTest
  setup do
    @client = MyProxyApiClient.new
    @client.stubs(:reseller_user_id).returns('10362')
    MyProxyApiClient.stubs(:new).returns(@client)
  end

  def order_for(owner, slug, type)
    category = ProductCategory.find_or_create_by!(slug: slug) do |c|
      c.name = slug.titleize
      c.available_to = 'both'
      c.category_type = 'proxy'
    end
    product = Product.create!(name: "1 x #{slug}", product_type: type, provider_type: 'myproxyapi',
                              provider_product_id: '141', available_to: 'both', product_category: category)
    pricing = ProductPricing.create!(product: product, currency: 'USD', selling_price: 5, active: true)
    Order.create!(orderable: owner, product: product, product_pricing: pricing, quantity: 1, status: 'active',
                  total_amount: 5, metadata: { 'provider_order_id' => 'vpnMPA-1934' })
  end

  test 'a customer restarts their VPN' do
    user = create_user_with_balance(0)
    order = order_for(user, 'residential-vpn', 'vpn')
    @client.expects(:restart_vpn).with('vpnMPA-1934').returns({ 'status' => 200 })

    post "/web/api/orders/#{order.id}/restart_vpn", headers: auth_header(user)

    assert_response :success
    assert_equal 'VPN restart requested', json_response['message']
  end

  test 'a reseller turns mobile rotation off, and a bad value is refused' do
    reseller = create_reseller_with_balance(0)
    order = order_for(reseller, 'mobile', 'mobile')
    @client.expects(:mobile_update_rotation).with('vpnMPA-1934', 'off').returns({ 'status' => 200 })

    post "/api/v1/orders/#{order.id}/rotation", params: { status: 'off' }, headers: auth_header(reseller)
    assert_response :success

    post "/api/v1/orders/#{order.id}/rotation", params: { status: 'sometimes' }, headers: auth_header(reseller)
    assert_response :unprocessable_entity
  end

  test "a customer cannot act on someone else's order" do
    order = order_for(create_user_with_balance(0), 'residential-vpn', 'vpn')

    post "/web/api/orders/#{order.id}/restart_vpn", headers: auth_header(create_user_with_balance(0))

    assert_response :not_found
  end

  test 'a reseller can now renew a MyProxyAPI VPN' do
    reseller = create_reseller_with_balance(50)
    order = order_for(reseller, 'residential-vpn', 'vpn')
    @client.expects(:place_extend).with(has_entry(period: '141')).returns({ 'status' => 200 })
    @client.stubs(:view_vpn_order).returns({ 'data' => {} })

    post "/api/v1/orders/#{order.id}/renew", headers: auth_header(reseller)

    assert_response :success
  end
end

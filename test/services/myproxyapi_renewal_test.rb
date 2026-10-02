# frozen_string_literal: true

require 'test_helper'

# Renewing a MyProxyAPI order extends it at the provider (place-extend, paid from our
# deposit) and charges the customer's wallet only when the provider accepted.
class MyproxyapiRenewalTest < ActiveSupport::TestCase
  VIEW = {
    'order' => { 'order_id' => 'A1F4LTYCDKKKWTULXTJK', 'end_time' => '2026-11-13 11:19:46', 'timezone' => 'EET' },
    'config' => { 'auth_user_pass' => { 'username' => 'u1', 'password' => 'p1' } }
  }.freeze

  setup do
    @user = create_user_with_balance(20)
    @client = MyProxyApiClient.new
    @client.stubs(:reseller_user_id).returns('10362')
    MyProxyApiClient.stubs(:new).returns(@client)
  end

  def order_for(slug, type: 'datacenter', provider_product_id: '57', metadata: {}, price: 5)
    category = ProductCategory.find_or_create_by!(slug: slug) do |c|
      c.name = slug.titleize
      c.available_to = 'both'
      c.category_type = 'proxy'
    end
    product = Product.create!(name: "1 x #{slug}", product_type: type, provider_type: 'myproxyapi',
                              provider_product_id: provider_product_id, available_to: 'both', product_category: category)
    pricing = ProductPricing.create!(product: product, currency: 'USD', selling_price: price, active: true)
    Order.create!(orderable: @user, product: product, product_pricing: pricing, quantity: 1, status: 'active',
                  total_amount: price, metadata: { 'provider_order_id' => 'A1F4LTYCDKKKWTULXTJK',
                                                   'my_proxy_api_response' => VIEW.deep_dup }.merge(metadata))
  end

  test 'a static IP order is extended by its months and the customer is charged once' do
    order = order_for('datacenter', metadata: { 'period' => '1' })
    @client.expects(:place_extend).with(user_id: '10362', order_id: 'A1F4LTYCDKKKWTULXTJK', period: '1')
           .returns({ 'status' => 200 })
    @client.expects(:view_order).returns({ 'data' => VIEW.merge('order' => VIEW['order'].merge('end_time' => '2026-12-13 11:19:46')) })

    assert OrderRenewalService.new(order, @user).process!

    assert_in_delta 15.0, @user.wallet.reload.balance.to_f
    assert_equal Time.utc(2026, 12, 13, 9, 19, 46), order.reload.expires_at
  end

  test 'a VPN is extended with its plan id, as the docs require' do
    order = order_for('residential-vpn', type: 'vpn', provider_product_id: '141')
    @client.expects(:place_extend).with(has_entry(period: '141')).returns({ 'status' => 200 })
    @client.stubs(:view_vpn_order).returns({ 'data' => VIEW })

    assert OrderRenewalService.new(order, @user).process!
  end

  test 'Global ISP is left alone: no extension and no charge' do
    order = order_for('global-isp', type: 'global_isp')
    @client.expects(:place_extend).never

    assert_raises(RuntimeError) { OrderRenewalService.new(order, @user).process! }
    assert_in_delta 20.0, @user.wallet.reload.balance.to_f
  end

  test 'a provider refusal leaves the wallet untouched' do
    order = order_for('datacenter')
    @client.stubs(:request).returns({ 'status' => 402, 'message' => 'Insufficient funds.' })

    error = assert_raises(RuntimeError) { OrderRenewalService.new(order, @user).process! }
    assert_includes error.message, 'Insufficient funds'
    assert_in_delta 20.0, @user.wallet.reload.balance.to_f
  end

  test 'mobile proxies are not extendable and nothing is charged' do
    order = order_for('mobile', type: 'mobile')
    @client.expects(:place_extend).never

    assert_raises(RuntimeError) { OrderRenewalService.new(order, @user).process! }
    assert_in_delta 20.0, @user.wallet.reload.balance.to_f
  end

  test 'a customer without enough balance is not extended at the provider' do
    order = order_for('datacenter', price: 50)
    @client.expects(:place_extend).never

    assert_raises(StandardError) { OrderRenewalService.new(order, @user).process! }
  end

  test 'VPN restart and mobile rotation call the documented endpoints' do
    vpn = order_for('residential-vpn', type: 'vpn')
    @client.expects(:restart_vpn).with('A1F4LTYCDKKKWTULXTJK').returns({ 'status' => 200 })
    ProxyManagementService.new(vpn).restart_vpn

    mobile = order_for('mobile', type: 'mobile')
    @client.expects(:mobile_update_rotation).with('A1F4LTYCDKKKWTULXTJK', 'off').returns({ 'status' => 200 })
    ProxyManagementService.new(mobile).update_rotation('off')
    assert_equal 'off', mobile.reload.metadata['rotation']

    assert_raises(RuntimeError) { ProxyManagementService.new(vpn).update_rotation('off') }
  end

  test 'rotation already in the requested state is not an error' do
    mobile = order_for('mobile', type: 'mobile')
    @client.stubs(:mobile_update_rotation)
           .raises(RuntimeError, 'MyProxyApi Error 422: {"status":422,"message":"Order protocol unchanged."}')

    ProxyManagementService.new(mobile).update_rotation('on')
    assert_equal 'on', mobile.reload.metadata['rotation']
  end
end

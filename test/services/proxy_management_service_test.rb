# frozen_string_literal: true

require 'test_helper'

class ProxyManagementServiceTest < ActiveSupport::TestCase
  # The shape MyProxyAPI's view-order call returns, as stored on the order.
  VIEW = {
    'ips' => ['74.91.49.93:23061:fxq4r1wbz0:secret1', '74.91.49.94:23062:fxq4r1wbz0:secret1'],
    'ips_info' => ['74.91.49.93 - US, New York, NY', '74.91.49.94 - US, New York, NY'],
    'order' => { 'order_id' => 'A1F4LTYCDKKKWTULXTJK', 'end_time' => '2026-06-13 11:19:46' },
    'config' => {
      'proxy_format' => 'socks5',
      'auth_user_pass' => { 'username' => 'fxq4r1wbz0', 'password' => 'secret1' },
      'auth_whitelistip' => [{ 'auth_id' => 1, 'ip_address' => '203.0.113.7' }]
    }
  }.freeze

  setup do
    @user = create_user_with_balance(0)
    @product = Product.create!(name: '1 x Datacenter Proxy', product_type: 'datacenter', provider_type: 'myproxyapi',
                               available_to: 'both', product_category: product_categories(:three))
    pricing = ProductPricing.create!(product: @product, currency: 'USD', selling_price: 5, active: true)
    @order = Order.create!(orderable: @user, product: @product, product_pricing: pricing, quantity: 1,
                           status: 'active', total_amount: 5,
                           metadata: { 'my_proxy_api_response' => VIEW.deep_dup })
  end

  test 'reads endpoints, login, protocol, location and whitelist from the stored order view' do
    details = ProxyManagementService.connection_details(@order)

    assert_equal VIEW['ips'], details[:endpoints]
    assert_equal '74.91.49.93', details[:ip]
    assert_equal '23061', details[:port]
    assert_equal 'fxq4r1wbz0', details[:username]
    assert_equal 'secret1', details[:password]
    assert_equal 'socks5', details[:protocol]
    assert_equal ['US, New York, NY'], details[:locations]
    assert_equal ['203.0.113.7'], details[:whitelist_ips]
  end

  test 'a protocol changed here wins over the stored one' do
    @order.update!(metadata: @order.metadata.merge('protocol' => 'http'))

    assert_equal 'http', ProxyManagementService.connection_details(@order)[:protocol]
  end

  test 'nothing stored means no details' do
    @order.update!(metadata: {})

    assert_nil ProxyManagementService.connection_details(@order)
  end

  test 'whitelist changes refresh the stored order view' do
    client = mock('myproxyapi')
    MyProxyApiClient.stubs(:new).returns(client)
    client.expects(:whitelist_add).with('A1F4LTYCDKKKWTULXTJK', '198.51.100.9', 'Whitelisted 198.51.100.9').returns('ok' => true)
    updated = VIEW.deep_dup
    updated['config']['auth_whitelistip'] << { 'ip_address' => '198.51.100.9' }
    client.expects(:view_order).with('A1F4LTYCDKKKWTULXTJK').returns('data' => updated)

    ProxyManagementService.new(@order).whitelist_add('198.51.100.9')

    assert_equal %w[203.0.113.7 198.51.100.9], ProxyManagementService.connection_details(@order.reload)[:whitelist_ips]
  end

  test 'a failed refresh keeps the stored view' do
    client = mock('myproxyapi')
    MyProxyApiClient.stubs(:new).returns(client)
    client.stubs(:whitelist_delete).returns('ok' => true)
    client.stubs(:view_order).returns('data' => nil)

    ProxyManagementService.new(@order).whitelist_delete('203.0.113.7')

    assert_equal VIEW['ips'], ProxyManagementService.connection_details(@order.reload)[:endpoints]
  end

  test 'residential rotating orders read the generated endpoints, login and traffic' do
    @order.update!(metadata: {
                     'locationsString' => 'Global Residential Pool',
                     'proxy_credentials' => [{ 'data' => ['ip-na.myproxyapi.com:9001:resuser:respass'], 'status' => 200 }],
                     'my_proxy_api_response' => { 'order_id' => 'R1', 'order_info' => {
                       'username' => 'resuser', 'password' => 'respass', 'traffic_used' => 0.25, 'traffic_limit' => 1
                     } }
                   })

    details = ProxyManagementService.connection_details(@order)

    assert_equal ['ip-na.myproxyapi.com:9001:resuser:respass'], details[:endpoints]
    assert_equal 'ip-na.myproxyapi.com', details[:ip]
    assert_equal '9001', details[:port]
    assert_equal %w[resuser respass], [details[:username], details[:password]]
    assert_equal ['Global Residential Pool'], details[:locations]
    assert_equal [0.25, 1], [details[:traffic_used_gb], details[:traffic_limit_gb]]
  end

  test 'a bare placement reply still gives the username' do
    @order.update!(metadata: { 'my_proxy_api_response' => { 'data' => { 'order_id' => 'G1', 'username' => 'gisp' } } })

    details = ProxyManagementService.connection_details(@order)

    assert_equal 'gisp', details[:username]
    assert_empty details[:endpoints]
  end

  test 'whitelisting always sends a description and credentials follow the documented format' do
    service = ProxyManagementService.new(@order)
    client = service.instance_variable_get(:@client)
    client.expects(:whitelist_add).with('A1F4LTYCDKKKWTULXTJK', '203.0.113.9', 'Whitelisted 203.0.113.9').returns({})
    client.stubs(:view_order).returns({ 'data' => VIEW })
    service.whitelist_add('203.0.113.9')

    client.expects(:update_credentials).never
    assert_raises(RuntimeError) { service.update_credentials('ab', 'secret1') }
    assert_raises(RuntimeError) { service.update_credentials('user_name', 'secret1') }
  end
end

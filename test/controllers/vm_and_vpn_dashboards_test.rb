# frozen_string_literal: true

require 'test_helper'

# The admin and reseller VPN, VPS and RDP pages show the same login, server and expiry
# the customer's own order page shows.
class VmAndVpnDashboardsTest < ActionDispatch::IntegrationTest
  VPN_VIEW = {
    'order' => { 'order_id' => 'V1', 'end_time' => '2026-06-10 00:43:33', 'timezone' => 'EEST' },
    'config' => { 'auth_credentials' => { 'username' => 'vpnuser1', 'password' => 'vpnpass1' } },
    'vpn_info' => [{ 'ip_info' => ' - US, North Carolina, NC', 'vpn_name' => 'vpnMPA-2063', 'vpn_type' => 'OpenVPN' }]
  }.freeze

  setup do
    employee = Employee.create!(email: "staff_#{SecureRandom.hex(4)}@test.com", first_name: 'Sam', last_name: 'Staff',
                                role: 'admin', active: true, department: departments(:one))
    @admin = { 'Authorization' => "Bearer #{JWT.encode({ employee_id: employee.id }, Rails.application.secret_key_base, 'HS256')}" }
    @reseller = create_reseller_with_balance(0)
  end

  def order_for(type, provider:, metadata: {})
    product = Product.create!(name: "Test #{type}", product_type: type, provider_type: provider,
                              available_to: 'both', product_category: product_categories(:three))
    pricing = ProductPricing.create!(product: product, currency: 'USD', selling_price: 5, active: true)
    Order.create!(orderable: @reseller, product: product, product_pricing: pricing, quantity: 1,
                  status: 'active', total_amount: 5, metadata: metadata)
  end

  def vm_for(type, **attrs)
    @ip = (@ip || 0) + 1
    order = order_for(type, provider: 'inhouse')
    vm_order = VmOrder.create!(order: order, vm_type: type, cpu_cores: 2, ram_gb: 4, disk_gb: 50, status: 'provisioning')
    vm = Vm.create!(vm_order: vm_order, status: 'active', vm_type: type, ip_address: "64.6.175.#{@ip}", hostname: 'rdp-abc',
                    dns_name: 'rdp-abc.proxysock.com', expires_at: Time.utc(2026, 11, 1), **attrs)
    [order, vm_order, vm]
  end

  test 'admin VPN list shows the login, server, location and provider end time' do
    order = order_for('vpn', provider: 'myproxyapi', metadata: { 'my_proxy_api_response' => VPN_VIEW.deep_dup })

    get '/admin/api/orders', params: { product_type: 'vpn' }, headers: @admin

    vpn = json_response['orders'].find { |o| o['id'] == order.id }
    assert_equal %w[vpnuser1 vpnpass1 vpnMPA-2063], vpn['credentials'].values_at('username', 'password', 'server')
    assert_equal 'US, North Carolina, NC', vpn['country']
    assert_equal Time.utc(2026, 6, 9, 21, 43, 33), Time.zone.parse(vpn['expires_at'])
  end

  test 'admin RDP list shows the VM state, host, RDP port, login and specs' do
    _order, vm_order, = vm_for('rdp', rdp_port: 51_577, rdp_username: 'Administrator', ssh_username: 'Administrator',
                                      root_password: 'Secret-1')

    get '/admin/api/vms', params: { vm_type: 'rdp' }, headers: @admin

    row = json_response['vms'].find { |v| v['id'] == vm_order.id }
    assert_equal 'active', row['status'], 'the VM status, not the never-updated vm_order status'
    assert_equal ['rdp-abc.proxysock.com', 51_577, 'Administrator', 'Secret-1'],
                 row.values_at('host', 'rdp_port', 'rdp_username', 'rdp_password')
    assert_equal [2, 4, 50], row.values_at('cpu_cores', 'ram_gb', 'storage_gb')
  end

  test 'admin VM controls queue the Proxmox job instead of failing' do
    _order, vm_order, vm = vm_for('vps', ssh_port: 2222, proxmox_vm_id: '20010')

    assert_enqueued_with(job: VmControlJob, args: [vm.id, 'stop']) do
      post "/admin/api/vms/#{vm_order.id}/stop", headers: @admin
    end
    assert_response :success
  end

  test 'reseller VM list separates VPS from RDP and gives the login' do
    vps_order, = vm_for('vps', ssh_port: 2222, ssh_username: 'root', root_password: 'Root-1')
    vm_for('rdp', rdp_port: 51_577)

    get '/api/v1/vms', params: { vm_type: 'vps' }, headers: auth_header(@reseller)

    assert_response :success
    assert_equal [vps_order.id], json_response['vms'].pluck('order_id')
    vps = json_response['vms'].first
    assert_equal ['rdp-abc.proxysock.com', 2222, 'root', 'Root-1', 'Test vps'],
                 vps.values_at('dns_name', 'ssh_port', 'username', 'root_password', 'plan_name')
  end

  test 'reseller order list gives VPN and VPS logins' do
    vpn_order = order_for('vpn', provider: 'myproxyapi', metadata: { 'my_proxy_api_response' => VPN_VIEW.deep_dup })
    vps_order, = vm_for('vps', ssh_port: 2222, root_password: 'Root-1')

    get '/api/v1/orders', params: { product_type: 'vpn,vps' }, headers: auth_header(@reseller)

    orders = json_response['orders'].index_by { |o| o['id'] }
    assert_equal 'vpnuser1', orders[vpn_order.id].dig('credentials', 'username')
    assert_equal 'US, North Carolina, NC', orders[vpn_order.id]['country']
    assert_equal [2222, 'Root-1'], orders[vps_order.id]['credentials'].values_at('port', 'password')
  end
end

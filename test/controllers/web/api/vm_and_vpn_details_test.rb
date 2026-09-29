# frozen_string_literal: true

require 'test_helper'

module Web
  module Api
    # The VPS/RDP and VPN pages read logins, ports and expiry from the order list.
    class VmAndVpnDetailsTest < ActionDispatch::IntegrationTest
      VPN_VIEW = {
        'order' => { 'order_id' => 'V1', 'end_time' => '2026-06-10 00:43:33', 'timezone' => 'EEST' },
        'config' => { 'auth_credentials' => { 'username' => 'vpnuser1', 'password' => 'vpnpass1' } },
        'vpn_info' => [{ 'ip_info' => ' - US, North Carolina, NC', 'vpn_name' => 'vpnMPA-2063', 'vpn_type' => 'OpenVPN' }]
      }.freeze

      setup { @user = create_user_with_balance(0) }

      def order_for(type, provider:, metadata: {})
        product = Product.create!(name: "Test #{type}", product_type: type, provider_type: provider,
                                  available_to: 'both', product_category: product_categories(:three))
        pricing = ProductPricing.create!(product: product, currency: 'USD', selling_price: 5, active: true)
        Order.create!(orderable: @user, product: product, product_pricing: pricing, quantity: 1,
                      status: 'active', total_amount: 5, metadata: metadata)
      end

      def listed(type, order)
        get '/web/api/orders', params: { product_type: type }, headers: auth_header(@user)
        assert_response :success
        json_response['orders'].find { |o| o['id'] == order.id }
      end

      test 'VPN shows its login, server, location and the provider end time' do
        order = order_for('vpn', provider: 'myproxyapi', metadata: { 'my_proxy_api_response' => VPN_VIEW.deep_dup })

        vpn = listed('vpn', order)

        assert_equal 'vpnuser1', vpn.dig('credentials', 'username')
        assert_equal 'vpnpass1', vpn.dig('credentials', 'password')
        assert_equal 'vpnMPA-2063', vpn.dig('credentials', 'server')
        assert_equal ['vpnMPA-2063 · OpenVPN · US, North Carolina, NC'], vpn.dig('credentials', 'endpoints')
        assert_equal 'US, North Carolina, NC', vpn['country']
        assert_equal Time.utc(2026, 6, 9, 21, 43, 33), Time.zone.parse(vpn['expires_at'])
      end

      test 'VPN credentials endpoint returns the same login' do
        order = order_for('vpn', provider: 'myproxyapi', metadata: { 'my_proxy_api_response' => VPN_VIEW.deep_dup })

        get "/web/api/orders/#{order.id}/credentials", headers: auth_header(@user)

        assert_response :success
        assert_equal %w[vpnuser1 vpnpass1 vpnMPA-2063 OpenVPN],
                     json_response.values_at('username', 'password', 'server', 'protocol')
      end

      test 'a VPS reached over RDP shows its RDP port, not a default SSH port, and its login' do
        order = order_for('vps', provider: 'inhouse')
        vm_order = VmOrder.create!(order: order)
        Vm.create!(vm_order: vm_order, status: 'active', vm_type: 'shared-cpu', ip_address: '64.6.175.30',
                   rdp_port: 51_577, ssh_username: 'vps-9onv65', ssh_password: 'secret-pass')

        vps = listed('vps', order)

        assert_nil vps['ssh_port']
        assert_equal 51_577, vps['rdp_port']
        assert_equal 'vps-9onv65', vps['username']
        assert_equal 'secret-pass', vps['password']
      end
    end
  end
end

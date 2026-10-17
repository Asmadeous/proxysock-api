# frozen_string_literal: true

require 'test_helper'

module Web
  module Api
    class VmOrderHistoryTest < ActionDispatch::IntegrationTest
      test 'order details use the saved VM configuration and assigned connection host' do
        vm = vms(:two)
        order = vm.vm_order.order
        order.product.update_columns(product_type: 'vps', metadata: { 'os_template' => 'ubuntu-22.04' })
        order.update_columns(status: 'active', metadata: {})
        vm.vm_order.update_columns(os_type: 'debian-12', cpu_cores: 4, ram_gb: 8, disk_gb: 80)
        vm.update_columns(hostname: 'history-server', dns_name: nil, status: 'active')

        get "/web/api/orders/#{order.id}", headers: auth_header(order.orderable)

        assert_response :success
        assert_equal 'debian-12', json_response['os_template']
        assert_equal 4, json_response['cpu_cores']
        assert_equal 8, json_response['ram_gb']
        assert_equal 80, json_response['storage_gb']
        assert_equal vm.connection_host, json_response['connection_host']
      end
    end
  end
end

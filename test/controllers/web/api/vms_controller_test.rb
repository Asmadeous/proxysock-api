# frozen_string_literal: true

require 'test_helper'

module Web
  module Api
    class VmsControllerTest < ActionDispatch::IntegrationTest
      include ActiveJob::TestHelper

      setup do
        @vm = vms(:two)
        @user = @vm.vm_order.order.orderable
      end

      test 'reboot queues a control job for an owned VM' do
        assert_enqueued_with(job: VmControlJob, args: [@vm.id, 'reboot']) do
          post "/web/api/vms/#{@vm.id}/reboot", headers: auth_header(@user)
        end
        assert_response :success
        assert_equal 'rebooting', json_response['status']
      end

      test 'reboot cannot access another actors VM' do
        assert_no_enqueued_jobs only: VmControlJob do
          post "/web/api/vms/#{vms(:one).id}/reboot", headers: auth_header(@user)
        end
        assert_response :not_found
      end

      test 'RDP backed VPS exposes its actual connection type and login' do
        @vm.update!(vm_type: 'vps', status: 'active', ip_address: nil, rdp_port: 51_577, ssh_port: nil, ssh_username: 'vps-login',
                    rdp_username: nil, hostname: 'my-server', dns_name: 'my-server.example.com')
        get '/web/api/vms', params: { vm_type: 'vps' }, headers: auth_header(@user)
        assert_response :success
        vm = json_response['vms'].find { |item| item['id'] == @vm.id }
        assert_nil vm['ssh_port']
        assert_equal 51_577, vm['rdp_port']
        assert_equal 'vps-login', vm['rdp_username']
        assert_equal 'my-server.example.com', vm['connection_host']
      end
    end
  end
end

# frozen_string_literal: true

require 'test_helper'

module Api
  module V1
    class VmsControllerTest < ActionDispatch::IntegrationTest
      setup do
        @reseller = resellers(:one)
        wallet = @reseller.wallets.find_by(wallet_type: 'main') || Wallet.create!(owner: @reseller, wallet_type: 'main')
        txn = Transaction.create!(transactable: @reseller, reference: @reseller, amount: 100.0,
                                  transaction_type: 'credit', status: 'success', currency: 'USD', description: 'Init')
        wallet.credit!(100.0, 'Init', {}, txn)
      end

      test 'should list VMs' do
        get '/api/v1/vms', headers: auth_header(@reseller)

        assert_response :success
        assert json_response.key?('vms') || json_response.is_a?(Array)
      end

      test 'should fail without authentication' do
        get '/api/v1/vms'

        assert_response :unauthorized
      end

      test 'should get VM status' do
        # Create a VM for the reseller
        order = Order.create!(
          orderable: @reseller,
          product: products(:one),
          product_pricing: product_pricings(:pricing_one),
          status: 'active'
        )

        vm_order = VmOrder.create!(
          order: order,
          vm_type: 'proxmox',
          status: 'active',
          cpu_cores: 2,
          ram_gb: 4,
          disk_gb: 50
        )

        vm = Vm.create!(
          vm_order: vm_order,
          status: 'active',
          ip_address: '10.0.0.1',
          proxmox_vm_id: '100'
        )

        get "/api/v1/vms/#{vm.id}", headers: auth_header(@reseller)

        assert_response :success
      end
    end
  end
end

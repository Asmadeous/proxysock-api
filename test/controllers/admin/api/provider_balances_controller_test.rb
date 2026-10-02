# frozen_string_literal: true

require 'test_helper'

module Admin
  module Api
    # The admin Overview shows each upstream provider's balance, MeiSIM's dealer wallet included.
    class ProviderBalancesControllerTest < ActionDispatch::IntegrationTest
      setup do
        employee = Employee.create!(email: "staff_#{SecureRandom.hex(4)}@test.com", first_name: 'Sam', last_name: 'Staff',
                                    role: 'admin', active: true, department: departments(:one))
        @headers = { 'Authorization' => "Bearer #{JWT.encode({ employee_id: employee.id }, Rails.application.secret_key_base, 'HS256')}" }
        MyProxyApiClient.any_instance.stubs(:account_info).returns({})
        EsimAccessService.any_instance.stubs(:balance_query).returns({ 'balance' => 0 })
      end

      test 'returns the MeiSIM dealer wallet balance and markup' do
        MeisimService.any_instance.stubs(:wallet)
                     .returns({ 'ok' => true, 'balance' => 63.55, 'markupPct' => 15, 'transactions' => [{ 'id' => 1 }] })

        get '/admin/api/provider_balances', headers: @headers

        assert_response :success
        assert_equal({ 'balance' => 63.55, 'markup_pct' => 15, 'currency' => 'USD' }, json_response['meisim'])
      end

      test 'reports a MeiSIM failure without breaking the other balances' do
        MeisimService.any_instance.stubs(:wallet).raises(MeisimService::Error.new('Unauthorized', status: 401))

        get '/admin/api/provider_balances', headers: @headers

        assert_response :success
        assert_equal 'Unauthorized', json_response.dig('meisim', 'error')
        assert json_response.key?('esim_access')
      end
    end
  end
end

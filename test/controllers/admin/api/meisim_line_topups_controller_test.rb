# frozen_string_literal: true

require 'test_helper'

module Admin
  module Api
    # Admins recharge MeiSIM lines through MeiSIM's top-up API. MeiSIM is mocked; nothing
    # here reaches the live API.
    class MeisimLineTopupsControllerTest < ActionDispatch::IntegrationTest
      OFFER = { 'BundleList' => [{ 'BundleProductCode' => 'ATT-25', 'BundleName' => 'Unlimited 30 days', 'Price' => 25 }],
                'TopUpList' => [10, 20] }.freeze

      def headers_for(role)
        @employee = Employee.create!(email: "staff_#{SecureRandom.hex(4)}@test.com", first_name: 'Sam', last_name: 'Staff',
                                     role: role, active: true, department: departments(:one))
        { 'Authorization' => "Bearer #{JWT.encode({ employee_id: @employee.id }, Rails.application.secret_key_base, 'HS256')}" }
      end

      setup do
        @admin = headers_for('admin')
        Rails.cache.clear
      end

      test 'checks a line and lists its plans and credit amounts' do
        MeisimService.any_instance.expects(:topup_confirm).with(network: 'ATT-US', number: '+13055550123').returns(OFFER)

        post '/admin/api/meisim/line_topups/check', params: { network: 'ATT-US', line: '+13055550123' }, headers: @admin

        assert_response :success
        assert_equal [{ 'code' => 'ATT-25', 'name' => 'Unlimited 30 days', 'value' => 25 }], json_response['plans']
        assert_equal [10, 20], json_response['credit_amounts']
      end

      test 'an ICCID is sent as the SIM serial, and the carriers are listed' do
        MeisimService.any_instance.expects(:topup_confirm).with(network: 'O2-UK', iccid: '8944100000000000001').returns({ 'TopUpList' => [10] })
        post '/admin/api/meisim/line_topups/check', params: { network: 'O2-UK', line: '8944 1000 0000 0000 001' }, headers: @admin
        assert_response :success

        MeisimService.any_instance.expects(:topup_networks).once.returns([{ 'NetworkName' => 'O2-UK' }, { 'NetworkName' => 'ATT-US' }])
        2.times { get '/admin/api/meisim/line_topups/networks', headers: @admin }
        assert_equal %w[O2-UK ATT-US], json_response['networks']
      end

      test 'plain credit on a line with plans is asked for by name, and the attempt is logged' do
        MeisimService.any_instance.stubs(:topup_confirm).returns(OFFER)
        MeisimService.any_instance.expects(:topup_recharge)
                     .with(network: 'ATT-US', number: '3055550123', value: '20', plan_code: nil, credit_only: true)
                     .returns({ 'Status' => 'Success' })

        post '/admin/api/meisim/line_topups', params: { network: 'ATT-US', line: '3055550123', value: 20 }, headers: @admin

        assert_response :success
        assert_equal 'applied', json_response['result']
        log = AuditLog.find_by!(action: 'meisim.line_topup')
        assert_equal %w[applied 3055550123], log.object_changes.values_at('result', 'line')
        get '/admin/api/meisim/line_topups', headers: @admin
        assert_equal 'Sam', json_response['topups'].first['by']
      end

      test 'a plan or amount MeiSIM did not offer for the line is never sent' do
        MeisimService.any_instance.stubs(:topup_confirm).returns(OFFER)
        MeisimService.any_instance.expects(:topup_recharge).never

        post '/admin/api/meisim/line_topups', params: { network: 'ATT-US', line: '3055550123', value: 25, plan_code: 'NOPE' },
                                              headers: @admin
        assert_response :unprocessable_entity
        post '/admin/api/meisim/line_topups', params: { network: 'ATT-US', line: '3055550123', value: 15 }, headers: @admin
        assert_response :unprocessable_entity
        assert_includes json_response['error'], '10, 20'
      end

      test 'recharging a queued customer top-up completes it, and it is never recharged twice' do
        topup = EsimTopup.create!(order: orders(:one), orderable: create_user_with_balance(0), topup_value: 10, price: 15)
        MeisimService.any_instance.stubs(:topup_confirm).returns(OFFER)
        MeisimService.any_instance.expects(:topup_recharge).once
                     .with(has_entries(plan_code: 'ATT-25', credit_only: false)).returns({ 'Status' => 'Success' })

        params = { network: 'ATT-US', line: '3055550123', value: 25, plan_code: 'ATT-25', esim_topup_id: topup.id }
        post '/admin/api/meisim/line_topups', params: params, headers: @admin
        assert_response :success
        assert_equal 'completed', topup.reload.status
        assert_includes topup.admin_note, 'Recharged via MeiSIM API'

        post '/admin/api/meisim/line_topups', params: params, headers: @admin
        assert_response :unprocessable_entity
      end

      test 'with no clear answer from MeiSIM the request stays pending and cannot be retried blindly' do
        topup = EsimTopup.create!(order: orders(:one), orderable: create_user_with_balance(0), topup_value: 10, price: 15)
        MeisimService.any_instance.stubs(:topup_confirm).returns(OFFER)
        MeisimService.any_instance.expects(:topup_recharge).once.raises(MeisimService::Error.new('Net::ReadTimeout'))
        params = { network: 'ATT-US', line: '3055550123', value: 10, esim_topup_id: topup.id }

        post '/admin/api/meisim/line_topups', params: params, headers: @admin
        assert_response :bad_gateway
        assert_equal 'unknown', json_response['result']
        assert_equal 'pending', topup.reload.status

        post '/admin/api/meisim/line_topups', params: params, headers: @admin
        assert_includes json_response['error'], 'Check the MeiSIM portal'
      end

      test 'only admins can recharge lines' do
        support = headers_for('support')
        MeisimService.any_instance.expects(:topup_recharge).never

        post '/admin/api/meisim/line_topups', params: { network: 'ATT-US', line: '3055550123', value: 10 }, headers: support

        assert_response :forbidden
      end
    end
  end
end

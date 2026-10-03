# frozen_string_literal: true

require 'test_helper'

module Admin
  module Api
    # Admins fund the MeiSIM dealer wallet through MeiSIM's Stripe checkout and download
    # its statement. MeiSIM is mocked; nothing here reaches the live API.
    class MeisimWalletControllerTest < ActionDispatch::IntegrationTest
      def headers_for(role)
        employee = Employee.create!(email: "staff_#{SecureRandom.hex(4)}@test.com", first_name: 'Sam', last_name: 'Staff',
                                    role: role, active: true, department: departments(:one))
        { 'Authorization' => "Bearer #{JWT.encode({ employee_id: employee.id }, Rails.application.secret_key_base, 'HS256')}" }
      end

      setup { @admin = headers_for('admin') }

      test 'previews the Stripe fee and returns the checkout link' do
        MeisimService.any_instance.expects(:topup_preview).with(100.to_d)
                     .returns({ 'ok' => true, 'net' => 100, 'gross' => 103.2, 'fee' => 3.2 })
        get '/admin/api/meisim/topup_preview', params: { amount: 100 }, headers: @admin
        assert_response :success
        assert_in_delta 3.2, json_response['fee']

        MeisimService.any_instance.expects(:topup).with(100.to_d)
                     .returns({ 'ok' => true, 'checkoutUrl' => 'https://checkout.stripe.com/c/pay/cs_x', 'netAmt' => 100,
                                'grossAmt' => 103.2, 'fee' => 3.2 })
        post '/admin/api/meisim/topup', params: { amount: 100 }, headers: @admin
        assert_response :success
        assert_equal 'https://checkout.stripe.com/c/pay/cs_x', json_response['checkout_url']
      end

      test 'amounts outside $50-$10,000 never reach MeiSIM' do
        MeisimService.any_instance.expects(:topup).never

        post '/admin/api/meisim/topup', params: { amount: 20 }, headers: @admin
        assert_response :unprocessable_entity
        post '/admin/api/meisim/topup', params: { amount: 20_000 }, headers: @admin
        assert_response :unprocessable_entity
      end

      test 'downloads the statement as CSV' do
        MeisimService.any_instance.expects(:statement).with(from: '2026-09-01', to: nil)
                     .returns("Date,Type,Amount USD\n2026-09-02,debit,-9.77\n")

        get '/admin/api/meisim/statement', params: { from: '2026-09-01' }, headers: @admin

        assert_response :success
        assert_equal 'text/csv', response.media_type
        assert_includes response.body, 'debit'
      end

      test 'only admins can top up' do
        MeisimService.any_instance.expects(:topup).never

        post '/admin/api/meisim/topup', params: { amount: 100 }, headers: headers_for('support')

        assert_response :forbidden
      end
      test 'verifies a batch of activation codes, reports progress and returns the CSV' do
        lpas = "LPA:1$T-MOBILE.IDEMIA.IO$AYU36-O48VE\nLPA:1$T-MOBILE.IDEMIA.IO$O0VQX-7MJVW"
        MeisimService.any_instance.expects(:esim_verify)
                     .with(['LPA:1$T-MOBILE.IDEMIA.IO$AYU36-O48VE', 'LPA:1$T-MOBILE.IDEMIA.IO$O0VQX-7MJVW'],
                           notify_email: 'ops@proxysock.com')
                     .returns({ 'ok' => true, 'batch_id' => 'b-9', 'total_rows' => 2, 'charged_usd' => 2.0 })
        post '/admin/api/meisim/verify', params: { lpas: lpas, notify_email: 'ops@proxysock.com' }, headers: @admin
        assert_response :success
        assert_equal ['b-9', 2.0], json_response.values_at('batch_id', 'charged_usd')

        MeisimService.any_instance.stubs(:esim_verify_batch).with('b-9')
                     .returns({ 'ok' => true, 'batch' => { 'id' => 'b-9' }, 'progress' => { 'total' => 2, 'used' => 1, 'available' => 1 } })
        get '/admin/api/meisim/verify/b-9', headers: @admin
        assert_equal 1, json_response.dig('progress', 'used')

        MeisimService.any_instance.stubs(:esim_verify_results_csv).with('b-9').returns("iccid,lpa,status\n8901,LPA:1$X$Y,used\n")
        get '/admin/api/meisim/verify/b-9/results', headers: @admin
        assert_equal 'text/csv', response.media_type
        assert_includes response.body, 'used'
      end

      test 'refuses empty input and anything that is not an activation code, without calling MeiSIM' do
        MeisimService.any_instance.expects(:esim_verify).never

        post '/admin/api/meisim/verify', params: { lpas: '  ' }, headers: @admin
        assert_response :unprocessable_entity
        post '/admin/api/meisim/verify', params: { lpas: "LPA:1$X$Y\n8901240527188633351" }, headers: @admin
        assert_response :unprocessable_entity
        assert_includes json_response['error'], '8901240527188633351'
      end

      test 'a low MeiSIM wallet is reported as such' do
        MeisimService.any_instance.stubs(:esim_verify).raises(MeisimService::Error.new('INSUFFICIENT_FUNDS', status: 402))

        post '/admin/api/meisim/verify', params: { lpas: 'LPA:1$X$Y' }, headers: @admin

        assert_response :payment_required
      end

      test 'lists recent bulk checks with their results, after the Verify dialog is gone' do
        employee = Employee.create!(email: "ops_#{SecureRandom.hex(4)}@test.com", first_name: 'Ana', last_name: 'Ops',
                                    role: 'admin', active: true, department: departments(:one))
        AuditLog.create!(action: 'meisim.esim_verify', user_id: employee.id, user_type: 'Employee', auditable: employee,
                         object_changes: { batch_id: 'b-old', codes: 3 }, created_at: 1.hour.ago)
        AuditLog.create!(action: 'meisim.esim_verify', user_id: employee.id, user_type: 'Employee', auditable: employee,
                         object_changes: { batch_id: 'b-new', codes: 2 })
        MeisimService.any_instance.stubs(:esim_verify_batch).with('b-old')
                     .returns({ 'progress' => { 'total' => 3, 'pending' => 0, 'in_progress' => 0, 'used' => 2, 'available' => 1 } })
        MeisimService.any_instance.stubs(:esim_verify_batch).with('b-new').raises(MeisimService::Error.new('boom'))

        get '/admin/api/meisim/verify', headers: @admin

        assert_response :success
        newest, oldest = json_response['batches']
        assert_equal %w[b-new 2 Ana], [newest['batch_id'], newest['codes'].to_s, newest['submitted_by']]
        assert_nil newest['progress'], 'one batch MeiSIM cannot answer for does not break the list'
        assert_equal 2, oldest.dig('progress', 'used')
      end
    end
  end
end

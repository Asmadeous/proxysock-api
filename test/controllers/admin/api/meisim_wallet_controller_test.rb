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
    end
  end
end

# frozen_string_literal: true

require 'test_helper'

module Admin
  module Api
    class EsimTopupsControllerTest < ActionDispatch::IntegrationTest
      setup do
        employee = Employee.create!(email: "staff_#{SecureRandom.hex(4)}@test.com", first_name: 'Sam',
                                    last_name: 'Staff', role: 'support', active: true,
                                    department: departments(:one))
        token = JWT.encode({ employee_id: employee.id }, Rails.application.secret_key_base, 'HS256')
        @headers = { 'Authorization' => "Bearer #{token}" }
        @user = create_user_with_balance(0)
        @topup = EsimTopup.create!(order: orders(:one), orderable: @user, topup_value: 10, price: 15)
      end

      test 'lists pending top-ups' do
        get '/admin/api/esim_topups', params: { status: 'pending' }, headers: @headers

        assert_response :success
        assert_equal [@topup.reference], json_response['topups'].pluck('reference')
        assert_equal 1, json_response['pending']
      end

      test 'marks a top-up done' do
        patch "/admin/api/esim_topups/#{@topup.id}/complete", params: { note: 'Done' }, headers: @headers

        assert_response :success
        assert_equal 'completed', json_response['status']
      end

      test 'cancels and refunds a top-up' do
        patch "/admin/api/esim_topups/#{@topup.id}/cancel", headers: @headers

        assert_response :success
        assert_equal 'cancelled', json_response['status']
        assert_equal BigDecimal('15'), @user.wallet.reload.balance
      end

      test 'requires staff' do
        get '/admin/api/esim_topups'

        assert_response :unauthorized
      end
    end
  end
end

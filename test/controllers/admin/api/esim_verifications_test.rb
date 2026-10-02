# frozen_string_literal: true

require 'test_helper'

module Admin
  module Api
    # Staff verify a sold eSIM's activation code through MeiSIM's eSIM Verify.
    class EsimVerificationsTest < ActionDispatch::IntegrationTest
      LPA = 'LPA:1$T-MOBILE.IDEMIA.IO$AYU36-O48VE-8PWDE-ZRXGS'

      setup do
        employee = Employee.create!(email: "staff_#{SecureRandom.hex(4)}@test.com", first_name: 'Sam', last_name: 'Staff',
                                    role: 'admin', active: true, department: departments(:one))
        @headers = { 'Authorization' => "Bearer #{JWT.encode({ employee_id: employee.id }, Rails.application.secret_key_base, 'HS256')}" }
        user = create_user_with_balance(0)
        product = Product.create!(name: 'World 1 GB', product_type: 'esim', provider: 'meisim', provider_product_id: 'mm-1',
                                  available_to: 'both', product_category: product_categories(:three))
        pricing = ProductPricing.create!(product: product, currency: 'USD', selling_price: 5, active: true)
        order = Order.create!(orderable: user, product: product, product_pricing: pricing, status: 'active', metadata: {})
        esim_order = EsimOrder.create!(order: order, provider_order_no: 'mo-1', package_code: 'mm-1', status: 'completed')
        @esim = esim_order.esims.create!(esim_provider: 'meisim', iccid: '8901', activation_code: LPA, status: 'active',
                                         esim_status: 'delivered', metadata: {})
      end

      test 'submits the activation code and then reports the verdict' do
        MeisimService.any_instance.expects(:esim_verify).with([LPA])
                     .returns({ 'ok' => true, 'batch_id' => 'b-1', 'total_rows' => 1, 'charged_usd' => 1.0 })

        post "/admin/api/esims/#{@esim.id}/verify", headers: @headers
        assert_response :success
        assert_equal 'b-1', @esim.reload.metadata.dig('verification', 'batch_id')

        MeisimService.any_instance.stubs(:esim_verify_batch).with('b-1')
                     .returns({ 'ok' => true, 'progress' => { 'total' => 1, 'pending' => 0, 'in_progress' => 0, 'used' => 1 } })
        get "/admin/api/esims/#{@esim.id}/verify", headers: @headers

        assert_response :success
        assert_equal 'used', json_response['status']
        assert_equal 'used', @esim.reload.metadata.dig('verification', 'status')
      end

      test 'a batch still running reads as pending' do
        @esim.update!(metadata: { 'verification' => { 'batch_id' => 'b-2' } })
        MeisimService.any_instance.stubs(:esim_verify_batch)
                     .returns({ 'progress' => { 'total' => 1, 'pending' => 1, 'in_progress' => 0 } })

        get "/admin/api/esims/#{@esim.id}/verify", headers: @headers

        assert_equal 'pending', json_response['status']
      end

      test 'eSIMs without an activation code are not sent, and a low MeiSIM wallet is reported' do
        @esim.update!(activation_code: nil)
        MeisimService.any_instance.expects(:esim_verify).never
        post "/admin/api/esims/#{@esim.id}/verify", headers: @headers
        assert_response :unprocessable_entity

        @esim.update!(activation_code: LPA)
        MeisimService.any_instance.stubs(:esim_verify).raises(MeisimService::Error.new('INSUFFICIENT_FUNDS', status: 402))
        post "/admin/api/esims/#{@esim.id}/verify", headers: @headers
        assert_response :payment_required
      end

      test 'only staff can verify' do
        post "/admin/api/esims/#{@esim.id}/verify"

        assert_response :unauthorized
      end
    end
  end
end

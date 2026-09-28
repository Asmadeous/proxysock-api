# frozen_string_literal: true

require 'test_helper'

module Web
  module Api
    class EsimTopupsControllerTest < ActionDispatch::IntegrationTest
      setup do
        @user = create_user_with_balance(100.0)
        product = Product.create!(
          name: 'AT&T Unlimited', product_type: 'esim', provider: 'meisim', provider_type: 'meisim',
          provider_product_id: 'man:att_unl', available_to: 'both', product_category: product_categories(:three),
          metadata: { 'meisim_line' => 'us_prepaid' }
        )
        pricing = ProductPricing.create!(product: product, currency: 'USD', selling_price: 30,
                                         reseller_selling_price: 30, user_selling_price: 30, active: true)
        @order = Order.create!(orderable: @user, product: product, product_pricing: pricing, quantity: 1,
                               status: 'active', total_amount: 30,
                               metadata: { 'imei' => '356938035643809', 'eid' => '89049032000001000000000000000001' })
        SlackNotifierService.stubs(:notify)
      end

      test 'shows the options, subscription and history' do
        get "/web/api/orders/#{@order.id}/topups", headers: auth_header(@user)

        assert_response :success
        assert json_response['eligible']
        assert_equal [{ 'value' => 10.0, 'price' => 15.0 }], json_response['one_time_options']
        assert_equal 10, json_response['min_subscription_value']
        assert_nil json_response['subscription']
        assert_empty json_response['topups']
      end

      test 'buys a one-time top-up and emails staff' do
        assert_enqueued_emails 1 do
          post "/web/api/orders/#{@order.id}/topups", params: { value: 10 }, headers: auth_header(@user)
        end

        assert_response :created
        assert_equal 'pending', json_response.dig('topup', 'status')
        assert_equal 85.0, json_response['available_balance']
      end

      test 'rejects a short balance with 402' do
        poor = create_user_with_balance(0)
        @order.update!(orderable: poor)

        post "/web/api/orders/#{@order.id}/topups", params: { value: 10 }, headers: auth_header(poor)

        assert_response :payment_required
        assert_match(/Insufficient balance/, json_response['error'])
      end

      test 'subscribes and cancels the monthly auto top-up' do
        post "/web/api/orders/#{@order.id}/topup_subscription", params: { value: 20 }, headers: auth_header(@user)
        assert_response :created
        assert_equal 20.0, json_response.dig('subscription', 'price')
        assert_equal 80.0, json_response['available_balance']

        delete "/web/api/orders/#{@order.id}/topup_subscription", headers: auth_header(@user)
        assert_response :success
        assert_equal 'cancelled', json_response.dig('subscription', 'status')
      end

      test "cannot touch another customer's line" do
        other = create_user_with_balance(100.0)

        post "/web/api/orders/#{@order.id}/topups", params: { value: 10 }, headers: auth_header(other)

        assert_response :not_found
        assert_empty EsimTopup.all
      end
    end
  end
end

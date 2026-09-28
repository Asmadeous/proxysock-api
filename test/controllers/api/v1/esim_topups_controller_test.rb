# frozen_string_literal: true

require 'test_helper'

module Api
  module V1
    class EsimTopupsControllerTest < ActionDispatch::IntegrationTest
      setup do
        @reseller = create_reseller_with_balance(100.0)
        product = Product.create!(
          name: 'AT&T Unlimited', product_type: 'esim', provider: 'meisim', provider_type: 'meisim',
          provider_product_id: 'man:att_unl', available_to: 'both', product_category: product_categories(:three),
          metadata: { 'meisim_line' => 'us_prepaid' }
        )
        pricing = ProductPricing.create!(product: product, currency: 'USD', selling_price: 30,
                                         reseller_selling_price: 30, user_selling_price: 30, active: true)
        @order = Order.create!(orderable: @reseller, product: product, product_pricing: pricing, quantity: 1,
                               status: 'active', total_amount: 30,
                               metadata: { 'imei' => '356938035643809', 'eid' => '89049032000001000000000000000001' })
        SlackNotifierService.stubs(:notify)
      end

      test 'reseller buys a one-time top-up on their own line' do
        post "/api/v1/orders/#{@order.id}/topups", params: { value: 10 }, headers: auth_header(@reseller)

        assert_response :created
        assert_equal 15.0, json_response.dig('topup', 'price')
        assert_equal 85.0, json_response['available_balance']
        assert_equal @reseller, EsimTopup.sole.orderable
      end

      test 'reseller sets up and cancels a monthly auto top-up at the chosen amount' do
        post "/api/v1/orders/#{@order.id}/topup_subscription", params: { value: 25 }, headers: auth_header(@reseller)
        assert_response :created
        assert_equal 25.0, json_response.dig('subscription', 'price')

        get "/api/v1/orders/#{@order.id}/topups", headers: auth_header(@reseller)
        assert_equal 'active', json_response.dig('subscription', 'status')

        delete "/api/v1/orders/#{@order.id}/topup_subscription", headers: auth_header(@reseller)
        assert_equal 'cancelled', json_response.dig('subscription', 'status')
      end

      test "reseller cannot top up another reseller's line" do
        other = create_reseller_with_balance(100.0)

        post "/api/v1/orders/#{@order.id}/topups", params: { value: 10 }, headers: auth_header(other)

        assert_response :not_found
        assert_empty EsimTopup.all
      end

      test 'customer tokens are refused' do
        get "/api/v1/orders/#{@order.id}/topups", headers: auth_header(create_user_with_balance(0))

        assert_response :unauthorized
      end

      test 'reseller order list says which lines can be topped up' do
        get '/api/v1/orders', params: { product_type: 'esim' }, headers: auth_header(@reseller)

        assert_response :success
        assert(json_response['orders'].find { |o| o['id'] == @order.id }['topup_eligible'])
      end
    end
  end
end

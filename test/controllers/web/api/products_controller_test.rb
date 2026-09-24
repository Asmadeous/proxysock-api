# frozen_string_literal: true

require 'test_helper'

module Web
  module Api
    class ProductsControllerTest < ActionDispatch::IntegrationTest
      setup do
        Rails.cache.clear
        @product = Product.create!(
          name: 'World 1 GB', product_type: 'esim', provider: 'meisim', provider_type: 'meisim',
          provider_product_id: 'world-1gb', available_to: 'both', active: true,
          product_category: product_categories(:three),
          metadata: { 'meisim_line' => 'travel', 'countries' => %w[JP US], 'retail_price' => 15.99,
                      'provider_name' => 'Ubigi', 'api_price' => 15.99, 'synced_at' => '2026-09-23T00:00:00Z' }
        )
        ProductPricing.create!(product: @product, currency: 'USD', api_price: 15.99, cost_price: 9.0,
                               selling_price: 15.99, reseller_selling_price: 15.99, user_selling_price: 19.19,
                               active: true)
      end

      def product_json(headers = {})
        get "/web/api/products/#{@product.id}", headers: headers
        assert_response :success
        json_response['product']
      end

      test 'public catalog hides provider cost and reseller prices' do
        product = product_json

        assert_in_delta 19.19, product['price'].to_f
        assert_equal %w[currency duration_type duration_value id selling_price user_selling_price],
                     product['pricings'].first.keys.sort
        assert_in_delta 19.19, product['pricings'].first['selling_price']
        %w[api_price retail_price provider_name synced_at cost_price].each { |key| assert_not product.key?(key), key }
        assert_equal 'travel', product['meisim_line']
      end

      test 'a reseller token also sees reseller prices without consuming the token' do
        reseller = resellers(:one)
        headers = auth_header(reseller)
        jti = reseller.reload.current_token_jti

        pricing = product_json(headers)['pricings'].first

        assert_in_delta 15.99, pricing['reseller_selling_price']
        assert_in_delta 15.99, pricing['selling_price']
        assert_not pricing.key?('api_price')
        assert_equal jti, reseller.reload.current_token_jti
      end

      test 'a user token gets the public view' do
        pricing = product_json(auth_header(users(:one)))['pricings'].first

        assert_not pricing.key?('reseller_selling_price')
      end

      test 'a bad token gets the public view instead of an error' do
        pricing = product_json('Authorization' => 'Bearer not-a-jwt')['pricings'].first

        assert_not pricing.key?('reseller_selling_price')
      end
    end
  end
end

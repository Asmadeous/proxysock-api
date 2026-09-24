# frozen_string_literal: true

require 'test_helper'

module Api
  module V1
    class ProductsControllerTest < ActionDispatch::IntegrationTest
      test 'eSIM products include plan details but no provider cost' do
        Rails.cache.clear
        product = Product.create!(
          name: 'AT&T $35', product_type: 'esim', provider: 'meisim', provider_product_id: 'p3:2:629',
          available_to: 'both', active: true, product_category: product_categories(:three),
          metadata: { 'meisim_line' => 'us_prepaid', 'countries' => ['US'], 'network' => 'AT&T Prepaid',
                      'validity_days' => 30, 'requires_imei' => true, 'requires_eid' => true,
                      'retail_price' => 44.2, 'provider_name' => 'MeiSIM' }
        )
        ProductPricing.create!(product: product, currency: 'USD', selling_price: 44.2, reseller_selling_price: 44.2,
                               active: true)

        get "/api/v1/products/#{product.id}", headers: auth_header(resellers(:one))

        assert_response :success
        esim = json_response.dig('product', 'esim')
        assert_equal 'us_prepaid', esim['meisim_line']
        assert_equal ['US'], esim['countries']
        assert_equal 30, esim['validity_days']
        assert_not esim.key?('retail_price')
        assert_not esim.key?('provider_name')
        assert json_response.dig('product', 'requires_imei')
      end
    end
  end
end

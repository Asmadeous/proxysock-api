# frozen_string_literal: true

require 'test_helper'

module Web
  module Api
    # My eSIMs reads each eSIM's allowance, validity, install links and QR from the order list.
    class EsimProfileDetailsTest < ActionDispatch::IntegrationTest
      test 'a MeiSIM travel eSIM carries its data, validity and install links but not MeiSIM links' do
        user = create_user_with_balance(0)
        product = Product.create!(name: 'Timor Leste 1 GB', product_type: 'esim', provider: 'meisim', provider_type: 'meisim',
                                  available_to: 'both', product_category: product_categories(:three),
                                  metadata: { 'meisim_line' => 'travel', 'data_limit' => '1', 'data_unit' => 'GB' })
        pricing = ProductPricing.create!(product: product, currency: 'USD', selling_price: 10, active: true)
        order = Order.create!(orderable: user, product: product, product_pricing: pricing, quantity: 1,
                              status: 'active', total_amount: 10, metadata: {})
        esim_order = EsimOrder.create!(order: order, esim_provider: 'meisim', status: 'completed', country_code: 'TL',
                                       duration_days: 7, metadata: {})
        esim_order.esims.create!(esim_provider: 'meisim', iccid: '8985200001', status: 'active',
                                 activation_code: 'LPA:1$smdp.example.com$T1', qr_code_data: 'LPA:1$smdp.example.com$T1',
                                 qr_code_url: 'https://api.meisimusa.com/qr?text=x', data_total_bytes: 1.gigabyte)

        get '/web/api/orders', params: { product_type: 'esim' }, headers: auth_header(user)

        assert_response :success, response.body[0, 500]
        profile = json_response['orders'].find { |o| o['id'] == order.id }['profiles'].sole
        assert_equal '1 GB', profile['data_label']
        assert_equal 7, profile['validity_days']
        assert_nil profile['expired_time']
        assert_nil profile['qr_code_url']
        assert_match(%r{\Ahttps://esimsetup\.apple\.com/}, profile.dig('install_links', 'ios'))
        assert_equal 'TL', profile['location_name']
      end
    end
  end
end

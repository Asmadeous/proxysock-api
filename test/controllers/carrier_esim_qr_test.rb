# frozen_string_literal: true

require 'test_helper'

# Moxee-style lines come with no activation code (qr_source "carrier"); customers and
# resellers get the QR from our own route, which fetches GET /dealer/order/:id/qr.
class CarrierEsimQrTest < ActionDispatch::IntegrationTest
  def esim_for(owner, activation_code: nil, metadata: { 'line' => 1, 'qr_source' => 'carrier', 'qr_available' => true })
    product = Product.create!(name: 'Moxee 2 Prepaid · 100 SMS Only', product_type: 'esim', provider: 'meisim',
                              provider_product_id: 'p3:445:799', available_to: 'both',
                              product_category: product_categories(:three),
                              metadata: { 'network' => 'Moxee 2', 'requires_eid' => false, 'accepts_address' => false })
    pricing = ProductPricing.create!(product: product, currency: 'USD', selling_price: 9.84, active: true)
    order = Order.create!(orderable: owner, product: product, product_pricing: pricing, status: 'active',
                          metadata: { 'imei' => '350923389416420' })
    esim_order = EsimOrder.create!(order: order, provider_order_no: 'f3faa8e6-e9f8', package_code: 'p3:445:799',
                                   status: 'completed')
    esim = esim_order.esims.create!(esim_provider: 'meisim', iccid: "8901#{SecureRandom.hex(4)}", activation_code: activation_code,
                                    msisdn: '3415128315', status: 'active', esim_status: 'delivered', metadata: metadata)
    [order, esim]
  end

  test 'a customer gets the carrier QR through our route and the page is told where it is' do
    user = create_user_with_balance(0)
    order, esim = esim_for(user)
    MeisimService.any_instance.expects(:qr_png).with('f3faa8e6-e9f8', line: 1).returns('PNGBYTES')

    get "/web/api/orders/#{order.id}/esims/#{esim.id}/qr", headers: auth_header(user)

    assert_response :success
    assert_equal 'image/png', response.media_type
    assert_equal 'PNGBYTES', response.body

    get '/web/api/orders', params: { product_type: 'esim' }, headers: auth_header(user)
    profile = json_response['orders'].find { |o| o['id'] == order.id }['profiles'].first
    assert_equal "/web/api/orders/#{order.id}/esims/#{esim.id}/qr", profile['qr_image_path']
  end

  test 'a reseller gets the carrier QR through the reseller API' do
    reseller = create_reseller_with_balance(0)
    order, esim = esim_for(reseller)
    MeisimService.any_instance.stubs(:qr_png).returns('PNGBYTES')

    get "/api/v1/orders/#{order.id}/esims/#{esim.id}/qr", headers: auth_header(reseller)

    assert_response :success
    assert_equal 'PNGBYTES', response.body
  end

  test 'eSIMs with an activation code, and physical SIMs, have no carrier QR' do
    user = create_user_with_balance(0)
    order, esim = esim_for(user, activation_code: 'LPA:1$SMDP.EXAMPLE$ABC')
    MeisimService.any_instance.expects(:qr_png).never

    get "/web/api/orders/#{order.id}/esims/#{esim.id}/qr", headers: auth_header(user)
    assert_response :unprocessable_entity

    _order, card = esim_for(user, metadata: { 'line' => 1, 'sim_type' => 'physical', 'qr_available' => false })
    assert_not card.carrier_qr?
  end

  test 'a QR MeiSIM cannot give yet is reported, not a crash' do
    user = create_user_with_balance(0)
    order, esim = esim_for(user)
    MeisimService.any_instance.stubs(:qr_png).raises(MeisimService::Error.new('no QR', status: 409))

    get "/web/api/orders/#{order.id}/esims/#{esim.id}/qr", headers: auth_header(user)

    assert_response :service_unavailable
  end

  test "another customer's eSIM QR is not served" do
    order, esim = esim_for(create_user_with_balance(0))

    get "/web/api/orders/#{order.id}/esims/#{esim.id}/qr", headers: auth_header(create_user_with_balance(0))

    assert_response :not_found
  end
end

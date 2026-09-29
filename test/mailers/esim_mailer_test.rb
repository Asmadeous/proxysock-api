# frozen_string_literal: true

require 'test_helper'

class EsimMailerTest < ActionMailer::TestCase
  setup do
    user = create_user_with_balance(10.0)
    product = Product.create!(name: 'AT&T Prepaid · Unlimited Saver', product_type: 'esim', provider: 'meisim',
                              provider_product_id: 'p3:2:629', available_to: 'both',
                              product_category: product_categories(:three))
    pricing = ProductPricing.create!(product: product, currency: 'USD', selling_price: 44.2, active: true)
    order = Order.create!(orderable: user, product: product, product_pricing: pricing, status: 'active',
                          metadata: { 'imei' => '350923389416420', 'eid' => '8' * 32 })
    esim_order = EsimOrder.create!(order: order, provider_order_no: 'mo-1', package_code: 'p3:2:629',
                                   status: 'completed')
    @esim = esim_order.esims.create!(
      esim_provider: 'meisim', iccid: '8901', activation_code: 'LPA:1$SMDP.EXAMPLE$ABC123',
      qr_code_url: 'https://api.meisimusa.com/qr?text=x', msisdn: '3415128315', pin1: '1234',
      status: 'active', esim_status: 'delivered',
      metadata: { 'smdp' => 'SMDP.EXAMPLE', 'matching_id' => 'ABC123',
                  'install_ios_url' => 'https://esimsetup.apple.com/x', 'install_android_url' => 'https://api.meisimusa.com/a' }
    )
    @user = user
  end

  test 'MeiSIM email has only the phone credentials and no MeiSIM links' do
    HTTParty.stubs(:get).returns(stub(success?: true, headers: { 'content-type' => 'image/png' }, body: 'PNG'))

    mail = EsimMailer.with(user: @user, esim: @esim).delivery_email
    html = mail.html_part&.body&.decoded || mail.body.decoded

    assert_equal [@user.email], mail.to
    assert_includes html, 'AT&amp;T Prepaid · Unlimited Saver'
    ['3415128315', '8901', '1234', 'SMDP.EXAMPLE', 'ABC123', 'LPA:1$SMDP.EXAMPLE$ABC123',
     'https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=LPA%3A1%24SMDP.EXAMPLE%24ABC123',
     'https://esimsetup.android.com/esim_qrcode_provisioning?carddata=LPA%3A1%24SMDP.EXAMPLE%24ABC123',
     'Install on iPhone', 'Install on Android'].each { |value| assert_includes html, value }
    assert_not_includes html, 'meisim', 'no MeiSIM links, package id or QR URL'
    assert_not_includes html, 'p3:2:629'
    assert mail.attachments['esim-qr.png'].inline?
    assert_includes html, "cid:#{mail.attachments['esim-qr.png'].cid}"
  end

  test 'MeiSIM email still sends when the QR image cannot be fetched' do
    HTTParty.stubs(:get).raises(Net::ReadTimeout)

    mail = EsimMailer.with(user: @user, esim: @esim).delivery_email

    assert_nil mail.attachments['esim-qr.png']
    assert_includes mail.body.decoded, 'LPA:1$SMDP.EXAMPLE$ABC123'
  end

  test 'eSIM Access email embeds the QR and gives the install links and activation code' do
    @esim.update!(esim_provider: 'esim_access', qr_code_url: 'https://static.redteago.com/qr/x.png', msisdn: nil, pin1: nil,
                  metadata: {})
    HTTParty.stubs(:get).returns(stub(success?: true, headers: { 'content-type' => 'image/png' }, body: 'PNG'))

    mail = EsimMailer.with(user: @user, esim: @esim).delivery_email
    html = mail.html_part&.body&.decoded || mail.body.decoded

    assert mail.attachments['esim-qr.png'].inline?
    assert_includes html, "cid:#{mail.attachments['esim-qr.png'].cid}"
    ['Install on iPhone', 'Install on Android', 'LPA:1$SMDP.EXAMPLE$ABC123', '8901'].each { |value| assert_includes html, value }
    assert_not_includes html, 'redteago', 'the QR is embedded, not linked'
  end
end

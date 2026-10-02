# frozen_string_literal: true

require 'test_helper'

class MeisimDeviceDetailsTest < ActiveSupport::TestCase
  IMEI = '356938035643809'
  EID = '89049032000001000000000000000001'
  ADDRESS = { 'address_line_1' => '120 Main St', 'city' => 'Phoenix', 'state' => 'AZ', 'zip_code' => '85001' }.freeze

  setup do
    @user = create_user_with_balance(0)
    @att = meisim_product('p3:2:629', 'AT&T Prepaid')
    @pricing = ProductPricing.create!(product: @att, currency: 'USD', selling_price: 44.2, active: true)
  end

  def meisim_product(id, network)
    Product.create!(name: id, product_type: 'esim', provider: 'meisim', provider_product_id: id, available_to: 'both',
                    product_category: product_categories(:three), metadata: { 'network' => network })
  end

  def order_for(product, metadata)
    Order.new(orderable: @user, product: product, product_pricing: @pricing, status: 'pending', metadata: metadata)
  end

  test 'all US prepaid MeiSIM lines require device details, travel plans do not' do
    assert MeisimDeviceDetails.required_for?(@att)
    assert MeisimDeviceDetails.required_for?(meisim_product('ly:1023', 'Lycamobile'))
    assert_not MeisimDeviceDetails.required_for?(meisim_product('fr-2gb', 'Orange'))
  end

  test 'a synced plan marked as needing no EID is ordered with the IMEI only' do
    lyca = meisim_product('ly:1035', 'Lycamobile')
    lyca.update!(metadata: lyca.metadata.merge('requires_eid' => false))

    details = MeisimDeviceDetails.new(lyca, { 'imei' => IMEI })
    assert_empty details.errors
    assert_nil details.to_params[:eid], 'no EID is sent when the plan needs none'
  end

  test 'the manual AT&T line needs device details and UK lines do not' do
    assert MeisimDeviceDetails.required_for?(meisim_product('man:att_30gb_6m', 'AT&T'))
    assert_not MeisimDeviceDetails.required_for?(meisim_product('p2n:o2_8gb', 'O2 UK'))
  end

  test 'order without imei and eid is rejected before payment' do
    order = order_for(@att, {})

    assert_not order.valid?
    assert_includes order.errors[:metadata], 'imei must be exactly 15 digits'
    assert_includes order.errors[:metadata], 'eid must be exactly 32 digits'
  end

  test 'valid imei and eid pass' do
    assert order_for(@att, { 'imei' => IMEI, 'eid' => EID }).valid?
  end

  test 'Moxee lines do not need an eid' do
    moxee = meisim_product('p3:445:799', 'Moxee 2')

    assert order_for(moxee, { 'imei' => IMEI }).valid?
    assert_nil MeisimDeviceDetails.new(moxee, { 'imei' => IMEI, 'eid' => EID }).to_params[:eid]
  end

  test 'lines that take an activation address require one' do
    @att.update!(metadata: @att.metadata.merge('accepts_address' => true))

    missing = order_for(@att, { 'imei' => IMEI, 'eid' => EID })
    assert_not missing.valid?
    assert_includes missing.errors[:metadata], 'address is required (street, city, state and ZIP)'
    assert order_for(@att, { 'imei' => IMEI, 'eid' => EID, 'address' => ADDRESS }).valid?
  end

  test 'lines that take no address (Moxee) do not require one' do
    moxee = meisim_product('p3:445:799', 'Moxee 2')
    moxee.update!(metadata: moxee.metadata.merge('accepts_address' => false))

    assert order_for(moxee, { 'imei' => IMEI }).valid?
  end

  test 'address is validated when given' do
    bad = order_for(@att, { 'imei' => IMEI, 'eid' => EID,
                            'address' => { 'address_line_1' => 'Main St', 'city' => 'P', 'state' => 'Arizona', 'zip_code' => '8500' } })

    assert_not bad.valid?
    assert_equal 4, bad.errors[:metadata].size
  end

  test 'to_params normalizes the address state and drops blank fields' do
    address = { 'address_line_1' => '120 Main St', 'city' => 'Phoenix', 'state' => 'az', 'zip_code' => '85001',
                'phone' => '' }
    params = MeisimDeviceDetails.new(@att, { imei: IMEI, eid: EID, address: address }).to_params

    assert_equal IMEI, params[:imei]
    assert_equal EID, params[:eid]
    assert_equal({ 'address_line_1' => '120 Main St', 'city' => 'Phoenix', 'state' => 'AZ', 'zip_code' => '85001' },
                 params[:address])
  end

  test 'accepts unpermitted controller params' do
    address = { 'address_line_1' => '1 A St', 'city' => 'Ab', 'state' => 'NY', 'zip_code' => '10001' }
    raw = ActionController::Parameters.new('imei' => IMEI, 'eid' => EID, 'address' => address)

    assert_empty MeisimDeviceDetails.new(@att, raw).errors
  end

  test 'validation runs on create only' do
    order = order_for(@att, { 'imei' => IMEI, 'eid' => EID })
    order.save!

    order.metadata = {}
    assert order.valid?
  end

  test 'US carrier lines are one device per order' do
    order = order_for(@att, { 'imei' => IMEI, 'eid' => EID })
    order.quantity = 2

    assert_not order.valid?
    assert_includes order.errors[:quantity], 'must be 1 for US carrier eSIMs (one device per line)'
  end

  test 'accepts IMEI and EID as phones display them, grouped with spaces' do
    details = MeisimDeviceDetails.new(@att, { 'imei' => '35 092338 941642 0',
                                              'eid' => '8904 9032 0071-0888 8100 1374 7194 6359' })

    assert_empty details.errors
    assert_equal '350923389416420', details.to_params[:imei]
    assert_equal '89049032007108888100137471946359', details.to_params[:eid]
  end
  test 'ZIP+4 is accepted and sent as five digits; a PO Box is refused' do
    plus4 = ADDRESS.merge('zip_code' => '85001-1234')
    details = MeisimDeviceDetails.new(@att, { 'imei' => IMEI, 'eid' => EID, 'address' => plus4 })
    assert_empty details.errors
    assert_equal '85001', details.to_params.dig(:address, 'zip_code')

    po_box = ADDRESS.merge('address_line_1' => '12 PO Box 445')
    assert_includes MeisimDeviceDetails.new(@att, { 'imei' => IMEI, 'eid' => EID, 'address' => po_box }).errors,
                    'address.address_line_1 cannot be a PO Box or mailbox'
  end
end

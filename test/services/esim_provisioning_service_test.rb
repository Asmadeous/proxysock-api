# frozen_string_literal: true

require 'test_helper'

class EsimProvisioningServiceTest < ActiveSupport::TestCase
  setup do
    @reseller = resellers(:one)
    @user     = users(:one)

    # Shared product category
    @category = product_categories(:one)

    @lyca_voice_product = Product.create!(
      name: 'Lyca Voice eSIM UK',
      product_type: 'esim',
      provider: 'lyca',
      available_to: 'both',
      product_category: @category,
      metadata: {
        'esim_type' => 'voice_data_sms',
        'data_gb' => 10,
        'calling_minutes' => 500,
        'sms_quota' => 200,
        'duration_days' => 30,
        'country_code' => 'GB',
        'network_operator' => 'Lyca Mobile'
      }
    )

    @lebara_voice_product = Product.create!(
      name: 'Lebara Voice eSIM UK',
      product_type: 'esim',
      provider: 'lebara',
      available_to: 'reseller',
      product_category: @category,
      metadata: {
        'esim_type' => 'voice_data_sms',
        'data_gb' => 20,
        'calling_minutes' => 1000,
        'sms_quota' => 500,
        'duration_days' => 30,
        'country_code' => 'GB',
        'network_operator' => 'Lebara'
      }
    )

    @lyca_pricing = @lyca_voice_product.product_pricings.create!(selling_price: 15.00, currency: 'USD')
    @lebara_pricing = @lebara_voice_product.product_pricings.create!(selling_price: 12.00, currency: 'USD')

    # Seed a single Lyca voice inventory item
    @lyca_inv = EsimInventory.create!(
      provider: 'lyca',
      esim_type: 'voice_data_sms',
      iccid: 'LYCA_VOICE_001',
      activation_code: 'LPA:1$lyca_test',
      qr_code_url: 'https://cdn.example.com/qr/lyca001.png',
      pin1: '1234',
      puk1: '12345678',
      status: 'available'
    )

    # Seed 5 Lebara voice inventory items
    @lebara_invs = 5.times.map do |i|
      EsimInventory.create!(
        provider: 'lebara',
        esim_type: 'voice_data_sms',
        iccid: "LEBARA_VOICE_00#{i}",
        activation_code: "LPA:1$lebara_test_#{i}",
        qr_code_url: "https://cdn.example.com/qr/lebara00#{i}.png",
        pin1: '0000',
        puk1: '00000000',
        status: 'available'
      )
    end
  end

  # ──────────────────────────────────────────────────────────────
  # Lyca voice — single line, available to customers
  # ──────────────────────────────────────────────────────────────
  test 'lyca voice eSIM: provisions 1 Esim record with qr_code_url set' do
    order = Order.create!(
      orderable: @user,
      product: @lyca_voice_product,
      product_pricing: @lyca_pricing,
      quantity: 1,
      status: 'pending'
    )

    EsimProvisioningService.new(order).provision!

    order.reload
    assert_equal 'active', order.status

    esim_order = order.esim_order
    assert_not_nil esim_order
    assert_equal 'voice_data_sms', esim_order.esim_type
    assert_equal 1, esim_order.moq_quantity

    esims = esim_order.esims
    assert_equal 1, esims.count

    esim = esims.first
    assert_equal 'LYCA_VOICE_001', esim.iccid
    assert_equal 'https://cdn.example.com/qr/lyca001.png', esim.qr_code_url
    assert_equal 'LPA:1$lyca_test', esim.activation_code
    assert esim.has_phone_number

    # Inventory should now be marked sold
    assert_equal 'sold', @lyca_inv.reload.status
  end

  # ──────────────────────────────────────────────────────────────
  # Lebara — MOQ of 5, reseller-only
  # ──────────────────────────────────────────────────────────────
  test 'lebara voice eSIM: raises MoqViolationError for quantity < 5' do
    order = Order.create!(
      orderable: @reseller,
      product: @lebara_voice_product,
      product_pricing: @lebara_pricing,
      quantity: 1,
      status: 'pending'
    )

    assert_raises(EsimProvisioningService::MoqViolationError) do
      EsimProvisioningService.new(order).provision!
    end
  end

  test 'lebara voice eSIM: provisions 5 Esim records for qty=5' do
    order = Order.create!(
      orderable: @reseller,
      product: @lebara_voice_product,
      product_pricing: @lebara_pricing,
      quantity: 5,
      status: 'pending'
    )

    EsimProvisioningService.new(order).provision!

    order.reload
    assert_equal 'active', order.status

    esim_order = order.esim_order
    assert_equal 'voice_data_sms', esim_order.esim_type
    assert_equal 5, esim_order.moq_quantity
    assert_equal 5, esim_order.esims.count

    # All iccids should be set, qr_code_url should be set
    esim_order.esims.each do |esim|
      assert esim.iccid.present?
      assert esim.qr_code_url.present?
      assert esim.has_phone_number
    end

    # All 5 inventory items should now be sold
    @lebara_invs.each { |inv| assert_equal 'sold', inv.reload.status }
  end

  # ──────────────────────────────────────────────────────────────
  # Out of stock
  # ──────────────────────────────────────────────────────────────
  test 'raises OutOfStockError when inventory is empty' do
    @lyca_inv.mark_as_sold!

    order = Order.create!(
      orderable: @user,
      product: @lyca_voice_product,
      product_pricing: @lyca_pricing,
      quantity: 1,
      status: 'pending'
    )

    assert_raises(EsimProvisioningService::OutOfStockError) do
      EsimProvisioningService.new(order).provision!
    end
  end
end

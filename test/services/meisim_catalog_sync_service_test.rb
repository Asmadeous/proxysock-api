# frozen_string_literal: true

require 'test_helper'

class MeisimCatalogSyncServiceTest < ActiveSupport::TestCase
  def plan(product_id, retail:, title: "Plan #{product_id}", category: 'esim_realtime', countries: ['US'])
    {
      'productId' => product_id,
      'productCategory' => category,
      'providerName' => 'MeiSIM',
      'retailPrice' => retail,
      'countries' => countries + ['United States'],
      'regions' => [],
      'productDetails' => [
        { 'name' => 'PLAN_TITLE', 'value' => title },
        { 'name' => 'PLAN_NETWORK', 'value' => 'Lycamobile' },
        { 'name' => 'VALIDITY_IN_DAYS', 'value' => '30' },
        { 'name' => 'PLAN_DATA_LIMIT ', 'value' => 'Unlimited' }
      ]
    }
  end

  def sync(plans)
    client = stub(products: plans)
    MeisimCatalogSyncService.new(client: client, logger: Logger.new(nil)).sync!
  end

  def meisim_product(product_id)
    Product.find_by!(provider: 'meisim', provider_product_id: product_id)
  end

  test 'creates active esim products with US prepaid metadata and pricing' do
    sync([plan('ly:1023', retail: 23.0, title: 'Lycamobile · $23 Unlimited International Plan')])

    product = meisim_product('ly:1023')
    assert product.active
    assert_equal 'esim', product.product_type
    assert_equal 'Lycamobile · Unlimited International Plan', product.name
    assert_equal 'meisim-ly-1023', product.slug
    assert_equal 'us_prepaid', product.metadata['meisim_line']
    assert_equal 'voice_data_sms', product.metadata['esim_type']
    assert_equal ['US'], product.metadata['countries']
    assert_equal 30, product.metadata['validity_days']
    assert_equal 'Unlimited', product.metadata['data_limit']
    assert product.metadata['requires_imei'], 'MeiSIM requires an IMEI for every US prepaid line'
    assert product.metadata['requires_eid']

    pricing = product.product_pricings.find_by!(currency: 'USD')
    assert_equal BigDecimal('26.45'), pricing.reseller_selling_price, 'retail $15-30: resellers +15%'
    assert_equal BigDecimal('23.00'), pricing.selling_price
    assert_equal BigDecimal('29.90'), pricing.user_selling_price, 'retail $15-30: customers +30%'
    assert_equal BigDecimal('12.65'), pricing.cost_price
  end

  test 'keeps plan description, calls, texts, coverage and notes' do
    att = plan('p3:2:630', retail: 45.0, title: 'AT&T Prepaid · $45 Unlimited Enhanced Select')
    att['productDetails'] += [
      { 'name' => 'PLAN_DESCRIPTION', 'value' => "Real US phone number.\n10GB mobile hotspot included" },
      { 'name' => 'VOICE', 'value' => 'Unlimited' },
      { 'name' => 'SMS', 'value' => '0' },
      { 'name' => 'PLAN_COVERAGE', 'value' => 'United States' },
      { 'name' => 'ACTIVATION_NOTE', 'value' => 'Phone must be unlocked.' },
      { 'name' => 'WARNINGS', 'value' => '' }
    ]
    lyca = plan('ly:1012', retail: 15.0, title: 'Lycamobile · $15 international Plan')
    lyca['productDetails'] << { 'name' => 'PLAN_DESCRIPTION', 'value' => '$15 international Plan' }
    sync([att, lyca])

    product = meisim_product('p3:2:630')
    assert_equal "Real US phone number.\n10GB mobile hotspot included", product.description
    assert_equal 'Unlimited', product.metadata['voice']
    assert_nil product.metadata['sms'], '"0" is unknown, not zero texts'
    assert_equal 'United States', product.metadata['coverage']
    assert_equal 'Phone must be unlocked.', product.metadata['activation_note']
    assert_nil product.metadata['warnings']
    assert_nil meisim_product('ly:1012').description, 'a description that repeats the title is dropped'
  end

  test 'strips the carrier list price from plan names' do
    plans = [
      plan('p3:2:1', retail: 49, title: 'T-Mobile Prepaid · $45.00 Starter 15GB'),
      plan('ly:1', retail: 15, title: 'Lycamobile · $10-300 MB + 3000 mins&sms-national'),
      plan('p3:2:2', retail: 29.5, title: 'AT&T Prepaid · $20 5GB')
    ]
    sync(plans)

    assert_equal 'T-Mobile Prepaid · Starter 15GB', meisim_product('p3:2:1').name
    assert_equal 'Lycamobile · 300 MB + 3000 mins&sms-national', meisim_product('ly:1').name
    assert_equal 'AT&T Prepaid · 5GB', meisim_product('p3:2:2').name
    assert_equal 'T-Mobile Prepaid · {price} Starter 15GB', meisim_product('p3:2:1').metadata['name_template']
    assert_equal 'Lycamobile · {price}-300 MB + 3000 mins&sms-national', meisim_product('ly:1').metadata['name_template']
    assert_nil meisim_product('p3:2:2').public_metadata['name_template']
  end

  test 'plans without a price in the title get no name template' do
    sync([plan('p3:2:3', retail: 10, title: 'Moxee 2 Prepaid · 100 SMS Only')])

    assert_nil meisim_product('p3:2:3').metadata['name_template']
    assert_equal 'Moxee 2 Prepaid · 100 SMS Only', meisim_product('p3:2:3').display_name(12)
  end

  test 'a plan never costs less than a cheaper plan in the tier below' do
    sync([plan('p3:2:1', retail: 29.5), plan('p3:2:2', retail: 30.0)])

    below = meisim_product('p3:2:1').product_pricings.first
    above = meisim_product('p3:2:2').product_pricings.first
    assert_equal BigDecimal('38.35'), below.user_selling_price
    assert_equal BigDecimal('39.00'), above.user_selling_price
    assert_operator above.reseller_selling_price, :>=, below.reseller_selling_price
  end

  test 'classifies non-US-prefix plans as travel with no known cost' do
    sync([plan('b5465006-105a-46c7-bd01-b5da432ae961', retail: 3.99, countries: ['FR'])])

    product = meisim_product('b5465006-105a-46c7-bd01-b5da432ae961')
    assert_equal 'travel', product.metadata['meisim_line']
    assert_equal 'data_only', product.metadata['esim_type']
    assert_nil product.product_pricings.first.cost_price
    assert_equal BigDecimal('5.99'), product.product_pricings.first.user_selling_price, 'retail under $15: customers +50%'
    assert_equal BigDecimal('4.99'), product.product_pricings.first.reseller_selling_price
  end

  test 'skips delayed eKYC plans' do
    sync([plan('mtel-1', retail: 37.99, category: 'esim_delayed')])

    assert_not Product.exists?(provider: 'meisim', provider_product_id: 'mtel-1')
  end

  test 'resync updates name and price but keeps a disabled product disabled' do
    sync([plan('p3:2:629', retail: 44.2)])
    product = meisim_product('p3:2:629')
    product.update!(active: false)

    sync([plan('p3:2:629', retail: 46.0, title: 'Renamed')])

    product.reload
    assert_not product.active, 'a product staff disabled stays disabled'
    assert_equal 'Renamed', product.name
    assert_equal 1, product.product_pricings.count
    assert_equal BigDecimal('50.60'), product.product_pricings.first.reseller_selling_price
  end

  test 'deactivates products that left the catalogue' do
    sync([plan('p3:2:629', retail: 44.2), plan('p3:2:630', retail: 45.0)])
    meisim_product('p3:2:630').update!(active: true)

    sync([plan('p3:2:629', retail: 44.2)])

    assert_not meisim_product('p3:2:630').active
  end

  test 'an empty catalogue deactivates nothing' do
    sync([plan('p3:2:629', retail: 44.2)])
    meisim_product('p3:2:629').update!(active: true)

    sync([])

    assert meisim_product('p3:2:629').active
  end

  test 'one bad plan is skipped without stopping the sync' do
    bad = plan('p3:2:999', retail: 10.0).except('retailPrice')

    synced = sync([bad, plan('p3:2:629', retail: 44.2)])

    assert_equal 1, synced
    assert_not Product.exists?(provider: 'meisim', provider_product_id: 'p3:2:999')
    assert meisim_product('p3:2:629')
  end

  test 'flags which US lines need IMEI and EID' do
    moxee = plan('p3:445:799', retail: 6.56)
    moxee['productDetails'] = moxee['productDetails'].map do |d|
      d['name'] == 'PLAN_NETWORK' ? d.merge('value' => 'Moxee 2') : d
    end
    sync([plan('p3:2:629', retail: 44.2), moxee])

    att = meisim_product('p3:2:629').metadata
    assert att['requires_imei']
    assert att['requires_eid']
    moxee_meta = meisim_product('p3:445:799').metadata
    assert moxee_meta['requires_imei']
    assert_not moxee_meta['requires_eid']
  end
end

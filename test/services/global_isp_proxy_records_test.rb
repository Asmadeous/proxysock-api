# frozen_string_literal: true

require 'test_helper'

# MyProxyAPI's Global ISP order view gives each proxy's location as an object; saving
# the proxies used to call String#split on it and fail an order we had already paid for.
class GlobalIspProxyRecordsTest < ActiveSupport::TestCase
  setup do
    user = create_user_with_balance(0)
    category = ProductCategory.find_or_create_by!(slug: 'global-isp') do |c|
      c.name = 'Global ISP'
      c.available_to = 'both'
      c.category_type = 'proxy'
    end
    product = Product.create!(name: '1 x Global ISP', product_type: 'global_isp', provider_type: 'myproxyapi',
                              available_to: 'both', product_category: category)
    pricing = ProductPricing.create!(product: product, currency: 'USD', selling_price: 9.79, active: true)
    @order = Order.create!(orderable: user, product: product, product_pricing: pricing, quantity: 1,
                           status: 'processing', total_amount: 9.79, metadata: {})
    @service = OrderProvisioningService.new(@order, user)
  end

  def save(response)
    @service.send(:save_specialized_proxy_records, 'global-isp', 'A16PZLBJF98S4XFKMS6N', response)
    GlobalIspProxy.where(order: @order).first
  end

  test 'saves the proxy when ips_info entries are objects' do
    proxy = save('ips' => { 'http' => ['45.12.1.9:8000:gu1:gp1'] },
                 'ips_info' => [{ 'ip' => '45.12.1.9', 'location' => 'Comcast, Dallas' }])

    assert_equal ['45.12.1.9', 8000, 'gu1', 'gp1'], [proxy.ip_address, proxy.port, proxy.username, proxy.password]
    assert_equal %w[Dallas Comcast], [proxy.city, proxy.isp_name]
  end

  test 'still saves the proxy when ips_info entries are text' do
    proxy = save('ips' => ['45.12.1.9:8000:gu1:gp1'], 'ips_info' => ['Comcast, Dallas'])

    assert_equal %w[Dallas Comcast], [proxy.city, proxy.isp_name]
  end
end

class GlobalIspOrderFlowTest < ActiveSupport::TestCase
  include ActiveJob::TestHelper

  test 'a Global ISP order goes from placement to active with its proxy saved and emailed' do
    user = create_user_with_balance(0)
    category = ProductCategory.find_or_create_by!(slug: 'global-isp') do |c|
      c.name = 'Global ISP'
      c.available_to = 'both'
      c.category_type = 'proxy'
    end
    product = Product.create!(name: '1 x Global ISP', product_type: 'global_isp', provider_type: 'myproxyapi',
                              provider_product_id: '14', available_to: 'both', product_category: category)
    pricing = ProductPricing.create!(product: product, currency: 'USD', selling_price: 9.79, cost_price: 7.0, active: true)
    order = Order.create!(orderable: user, product: product, product_pricing: pricing, quantity: 1, status: 'processing',
                          total_amount: 9.79, metadata: { 'selected_country_id' => 61, 'target_section_id' => 221,
                                                          'target_id' => 3_281_093, 'period' => '1' })
    client = MyProxyApiClient.new
    client.stubs(:reseller_user_id).returns('10362')
    client.stubs(:get_price).returns({ 'data' => { 'price' => '7.00' } })
    client.expects(:place_order).with(has_entries(product_api_id: 1, type: 'global-isp'))
          .returns({ 'data' => { 'order_id' => 'A16PZLBJF98S4XFKMS6N' } })
    client.stubs(:view_global_isp_order).returns(
      { 'data' => { 'ips' => { 'http' => ['45.12.1.9:8000:gu1:gp1'] },
                    'ips_info' => [{ 'ip' => '45.12.1.9', 'location' => 'Comcast, Dallas' }],
                    'username' => 'gu1', 'password' => 'gp1' } }
    )
    MyProxyApiClient.stubs(:new).returns(client)
    service = OrderProvisioningService.new(order, user)
    service.stubs(:sleep)

    service.send(:provision_proxy!)

    assert_equal 'active', order.reload.status
    assert_equal '45.12.1.9', GlobalIspProxy.find_by!(order: order).ip_address
    assert_equal 'A16PZLBJF98S4XFKMS6N', order.metadata['provider_order_id']
  end
end

class GlobalIspCredentialsEmailTest < ActionMailer::TestCase
  test 'the credentials email renders for the Global ISP reply shape' do
    user = create_user_with_balance(0)
    product = Product.create!(name: '1 x Global ISP', product_type: 'global_isp', provider_type: 'myproxyapi',
                              available_to: 'both', product_category: product_categories(:three))
    pricing = ProductPricing.create!(product: product, currency: 'USD', selling_price: 9.79, active: true)
    order = Order.create!(orderable: user, product: product, product_pricing: pricing, quantity: 1, status: 'active',
                          total_amount: 9.79, metadata: {})
    reply = { 'ips' => { 'http' => ['45.12.1.9:8000:gu1:gp1'] },
              'ips_info' => [{ 'ip' => '45.12.1.9', 'location' => 'Comcast, Dallas' }], 'username' => 'gu1', 'password' => 'gp1' }

    mail = InvoiceMailer.with(order: order, owner: user, api_response: reply).api_proxy_credentials_email
    body = mail.html_part&.body&.decoded || mail.body.decoded

    assert_equal [user.email], mail.to
    assert_includes body, 'gu1'
  end
end

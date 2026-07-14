# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Web::Api::Orders', type: :request do
  include ActiveJob::TestHelper

  let(:user) { User.create!(username: 'order_user', email: 'order@test.com', first_name: 'O', last_name: 'U', password: 'password123', country_code: 'US', city: 'New York') }
  let(:wallet) { user.wallet }
  let(:token) { user.generate_jwt }
  let(:headers) { { 'Authorization' => "Bearer #{token}", 'Accept' => 'application/json' } }

  let(:category) { ProductCategory.create!(name: 'Proxies', slug: 'proxies') }
  let(:product) do
    Product.create!(
      name: 'Residential Proxy',
      product_type: 'proxy',
      provider: 'xproxy',
      product_category: category,
      available_to: 'both'
    )
  end
  let!(:pricing) { ProductPricing.create!(product: product, selling_price: 10.0, active: true, currency: 'USD') }

  describe 'POST /web/api/orders' do
    let(:params) { { product_id: product.id, quantity: 1, payment_method: 'wallet' } }

    context 'with sufficient balance' do
      before do
        wallet.credit!(100.0, 'Initial')
        # Mocking the actual provisioning step, but allowing the rest of process! to run
        allow_any_instance_of(OrderProvisioningService).to receive(:provision_product!).and_return(true)
        # Mocking invoices to avoid background job/mailer noise
        allow_any_instance_of(InvoicePdfService).to receive(:generate_and_attach!).and_return(true)
        # Mocking Jellyfin account creation to avoid shelling out to curl
        allow_any_instance_of(JellyfinService).to receive(:create_user).and_return(true)
      end

      it 'creates an order and deducts balance' do
        expect do
          post '/web/api/orders', params: params, headers: headers
        end.to change(Order, :count).by(1)

        expect(response).to have_http_status(:created)

        # The wallet debit happens inside OrderProvisioningJob (provisioning
        # runs in the background) — execute it to observe the deduction.
        perform_enqueued_jobs(only: OrderProvisioningJob)

        expect(wallet.reload.balance.to_f).to eq(90.0) # 100 - 10
      end
    end

    context 'with insufficient balance' do
      it 'returns 402 Payment Required and marks order as failed' do
        expect do
          post '/web/api/orders', params: params, headers: headers
        end.to change(Order, :count).by(1)
        expect(response).to have_http_status(:payment_required)
        expect(Order.order(created_at: :desc).first.status).to eq('failed')
      end
    end

    context 'with RexPay gateway' do
      before do
        mock_gateway = double('RexpayService')
        allow(RexpayService).to receive(:new).and_return(mock_gateway)
        allow(mock_gateway).to receive(:create_payment).and_return({ payment_url: 'http://rex.pay' })
      end

      it 'returns a payment URL and USD amount' do
        post '/web/api/orders', params: params.merge(payment_method: 'gateway', gateway: 'rexpay'), headers: headers

        expect(response).to have_http_status(:accepted)
        json = JSON.parse(response.body)
        expect(json['payment_url']).to eq('http://rex.pay')
        expect(json['payment_amount'].to_f).to eq(10.0) # USD, no conversion
        expect(json['payment_currency']).to eq('USD')
      end
    end
  end

  describe 'POST /web/api/orders/checkout_cart' do
    let(:items) { [{ product_id: product.id, quantity: 2 }] }

    it 'creates a checkout session for gateway payment' do
      mock_gateway = double('RexpayService')
      allow(RexpayService).to receive(:new).and_return(mock_gateway)
      allow(mock_gateway).to receive(:create_payment).and_return({ payment_url: 'http://rex.pay/cart' })

      post '/web/api/orders/checkout_cart', params: { items: items, payment_method: 'gateway', gateway: 'rexpay' }, headers: headers

      expect(response).to have_http_status(:accepted)
      json = JSON.parse(response.body)
      expect(json['payment_amount'].to_f).to eq(20.0) # 2 * 10 USD, no conversion
      expect(json['payment_currency']).to eq('USD')

      expect(CheckoutSession.last.total_amount).to eq(20.0)
    end
  end
end

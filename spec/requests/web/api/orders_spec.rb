# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Web::Api::Orders', type: :request do
  let(:user) { User.create!(username: 'order_user', email: 'order@test.com', first_name: 'O', last_name: 'U', password: 'password123') }
  let!(:wallet) { Wallet.create!(owner: user, wallet_type: 'main') }
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
      end

      it 'creates an order and deducts balance' do
        expect {
          post '/web/api/orders', params: params, headers: headers
        }.to change(Order, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(wallet.reload.balance.to_f).to eq(90.0) # 100 - 10
      end
    end

    context 'with insufficient balance' do
      it 'returns 402 Payment Required and marks order as failed' do
        expect {
          post '/web/api/orders', params: params, headers: headers
        }.to change(Order, :count).by(1)
        expect(response).to have_http_status(:payment_required)
        expect(Order.order(created_at: :desc).first.status).to eq('failed')
      end
    end

    context 'with Paystack gateway' do
      before do
        allow(FixerService).to receive(:get_rate).and_return(1400.0)
        mock_gateway = double('PaystackService')
        allow(PaystackService).to receive(:new).and_return(mock_gateway)
        allow(mock_gateway).to receive(:initialize_transaction).and_return({ authorization_url: 'http://pay.stack' })
      end

      it 'returns a payment URL and NGN amount' do
        post '/web/api/orders', params: params.merge(payment_method: 'gateway', gateway: 'paystack'), headers: headers
        
        expect(response).to have_http_status(:accepted)
        json = JSON.parse(response.body)
        expect(json['payment_url']).to eq('http://pay.stack')
        expect(json['payment_amount'].to_f).to eq(14000.0) # 10 USD * 1400 NGN/USD
        expect(json['payment_currency']).to eq('NGN')
      end
    end
  end

  describe 'POST /web/api/orders/checkout_cart' do
    let(:items) { [{ product_id: product.id, quantity: 2 }] }

    it 'creates a checkout session for gateway payment' do
      allow(FixerService).to receive(:get_rate).and_return(1400.0)
      mock_gateway = double('PaystackService')
      allow(PaystackService).to receive(:new).and_return(mock_gateway)
      allow(mock_gateway).to receive(:initialize_transaction).and_return({ authorization_url: 'http://pay.stack/cart' })

      post '/web/api/orders/checkout_cart', params: { items: items, payment_method: 'gateway', gateway: 'paystack' }, headers: headers

      expect(response).to have_http_status(:accepted)
      json = JSON.parse(response.body)
      expect(json['payment_amount'].to_f).to eq(28000.0) # 2 * 10 * 1400
      expect(json['payment_currency']).to eq('NGN')
      
      expect(CheckoutSession.last.total_amount).to eq(20.0)
    end
  end
end

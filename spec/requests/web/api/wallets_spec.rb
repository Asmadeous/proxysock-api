# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Web::Api::Wallets', type: :request do
  let(:email) { 'test@example.com' }
  let(:password) { 'password123' }
  let(:user) { User.create!(username: 'testuser', email: email, first_name: 'Test', last_name: 'User', password: password, country_code: 'US', city: 'New York') }
  let(:token) { user.generate_jwt }
  let(:headers) { { 'Authorization' => "Bearer #{token}", 'Accept' => 'application/json' } }

  describe 'POST /web/api/wallet/deposit' do
    let(:amount) { 100.0 }
    let(:gateway) { 'bachs' }
    let(:currency) { 'USD' }

    context 'with Bachs' do
      before do
        expect_any_instance_of(BachsService).to receive(:payment_link)
          .with(hash_including(amount: 100.0, email: user.email))
          .and_return({ url: 'https://checkout.bachs.test/pay/abc', amount: 100.0, currency: 'USD' })
      end

      it 'returns a successful response with the USD amount and currency' do
        post '/web/api/wallet/deposit', params: { amount: amount, gateway: gateway }, headers: headers

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['payment_url']).to eq('https://checkout.bachs.test/pay/abc')
        expect(json['payment_amount'].to_f).to eq(100.0)
        expect(json['payment_currency']).to eq('USD')
      end

      it 'creates a pending deposit with the intended USD amount' do
        expect do
          post '/web/api/wallet/deposit', params: { amount: amount, gateway: gateway }, headers: headers
        end.to change(Deposit, :count).by(1)

        deposit = Deposit.last
        expect(deposit.status).to eq('pending')
        expect(deposit.amount).to eq(100.0)
      end
    end
  end
end

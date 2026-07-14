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
    let(:gateway) { 'rexpay' }
    let(:currency) { 'USD' }

    context 'with RexPay' do
      before do
        # Mocking RexpayService to return a mock payment URL — RexPay charges USD directly
        mock_rexpay = double('RexpayService')
        expect(RexpayService).to receive(:new).and_return(mock_rexpay)
        expect(mock_rexpay).to receive(:create_payment).with(
          hash_including(
            email: user.email,
            amount: 100.0, # USD, no conversion
            currency: 'USD'
          )
        ).and_return({ payment_url: 'https://pgs-sandbox.globalaccelerex.com/pay/abc' })
      end

      it 'returns a successful response with USD amount and currency' do
        post '/web/api/wallet/deposit', params: { amount: amount, gateway: gateway }, headers: headers

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['payment_url']).to eq('https://pgs-sandbox.globalaccelerex.com/pay/abc')
        expect(json['payment_amount'].to_f).to eq(100.0)
        expect(json['payment_currency']).to eq('USD')
      end

      it 'creates a pending deposit' do
        expect do
          post '/web/api/wallet/deposit', params: { amount: amount, gateway: gateway }, headers: headers
        end.to change(Deposit, :count).by(1)

        deposit = Deposit.last
        expect(deposit.status).to eq('pending')
        expect(deposit.amount).to eq(100.0) # USD amount
      end
    end
  end
end

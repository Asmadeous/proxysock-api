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
        # Mocking FixerService to return a fixed rate
        allow(FixerService).to receive(:get_rate).with('USD', 'NGN').and_return(1400.0)

        # Mocking RexpayService to return a mock payment URL
        mock_rexpay = double('RexpayService')
        expect(RexpayService).to receive(:new).and_return(mock_rexpay)
        expect(mock_rexpay).to receive(:create_payment).with(
          hash_including(
            email: user.email,
            amount: 140_000.0, # NGN, major units
            currency: 'NGN'
          )
        ).and_return({ payment_url: 'https://pgs-sandbox.globalaccelerex.com/pay/abc' })
      end

      it 'returns a successful response with NGN amount and currency' do
        post '/web/api/wallet/deposit', params: { amount: amount, gateway: gateway }, headers: headers

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['payment_url']).to eq('https://pgs-sandbox.globalaccelerex.com/pay/abc')
        expect(json['payment_amount'].to_f).to eq(140_000.0)
        expect(json['payment_currency']).to eq('NGN')
      end

      it 'creates a pending deposit with stored exchange rate' do
        expect do
          post '/web/api/wallet/deposit', params: { amount: amount, gateway: gateway }, headers: headers
        end.to change(Deposit, :count).by(1)

        deposit = Deposit.last
        expect(deposit.status).to eq('pending')
        expect(deposit.amount).to eq(100.0) # Original USD amount
        expect(deposit.metadata['exchange_rate']).to eq(1400.0)
      end
    end
  end
end

# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Web::Api::Wallets', type: :request do
  let(:email) { 'test@example.com' }
  let(:password) { 'password123' }
  let(:user) { User.create!(username: 'testuser', email: email, first_name: 'Test', last_name: 'User', password: password) }
  let(:token) { user.generate_jwt }
  let(:headers) { { 'Authorization' => "Bearer #{token}", 'Accept' => 'application/json' } }

  describe 'POST /web/api/wallet/deposit' do
    let(:amount) { 100.0 }
    let(:gateway) { 'paystack' }
    let(:currency) { 'USD' }

    context 'with Paystack' do
      before do
        # Mocking FixerService to return a fixed rate
        allow(FixerService).to receive(:get_rate).with('USD', 'NGN').and_return(1400.0)
        
        # Mocking PaystackService to return a mock payment URL
        mock_paystack = double('PaystackService')
        expect(PaystackService).to receive(:new).and_return(mock_paystack)
        expect(mock_paystack).to receive(:initialize_transaction).with(
          hash_including(
            email: user.email,
            amount: 14000000
          )
        ).and_return({ authorization_url: 'http://paystack.com/pay/abc' })
      end

      it 'returns a successful response with NGN amount and currency' do
        post '/web/api/wallet/deposit', params: { amount: amount, gateway: gateway }, headers: headers
        
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['payment_url']).to eq('http://paystack.com/pay/abc')
        expect(json['payment_amount'].to_f).to eq(140000.0)
        expect(json['payment_currency']).to eq('NGN')
      end

      it 'creates a pending deposit with stored exchange rate' do
        expect {
          post '/web/api/wallet/deposit', params: { amount: amount, gateway: gateway }, headers: headers
        }.to change(Deposit, :count).by(1)

        deposit = Deposit.last
        expect(deposit.status).to eq('pending')
        expect(deposit.amount).to eq(100.0) # Original USD amount
        expect(deposit.metadata['exchange_rate']).to eq(1400.0)
      end
    end
  end
end

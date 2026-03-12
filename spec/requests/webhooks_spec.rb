# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Webhooks', type: :request do
  let(:paystack_secret) { 'sk_test_123' }

  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:[]).with('PAYSTACK_SECRET_KEY').and_return(paystack_secret)
    allow(ENV).to receive(:fetch).with('PAYSTACK_SECRET_KEY', any_args).and_return(paystack_secret)
  end

  describe 'POST /webhooks/paystack' do
    let(:user) { User.create!(username: 'webhook_user', email: 'webhook@test.com', first_name: 'W', last_name: 'H', password: 'password123') }
    let(:wallet) { user.wallet }
    let(:transaction_ref) { 'DEP_mock_123' }
    let!(:deposit) do
      Deposit.create!(
        depositable: user,
        amount: 50.0, # $50 USD
        gateway: 'paystack',
        status: 'pending',
        metadata: { transaction_ref: transaction_ref, exchange_rate: 1400.0 }
      )
    end

    let(:payload) do
      {
        event: 'charge.success',
        data: {
          reference: transaction_ref,
          status: 'success',
          amount: 7000000, # 50 USD * 1400 NGN/USD * 100 kobo = 7,000,000
          currency: 'NGN',
          metadata: { deposit_id: deposit.id }
        }
      }.to_json
    end

    let(:signature) { OpenSSL::HMAC.hexdigest('SHA512', paystack_secret, payload) }

    it 'processes a successful charge and credits the wallet' do
      post '/webhooks/paystack', params: payload, headers: { 'X-Paystack-Signature' => signature, 'Content-Type' => 'application/json' }
      
      expect(response).to have_http_status(:ok)
      expect(deposit.reload.status).to eq('completed')
      expect(wallet.reload.balance).to be_within(0.01).of(50.0)
    end

    it 'rejects invalid signature' do
      post '/webhooks/paystack', params: payload, headers: { 'X-Paystack-Signature' => 'invalid', 'Content-Type' => 'application/json' }
      expect(response).to have_http_status(:bad_request)
      expect(deposit.reload.status).to eq('pending')
    end

    it 'rejects underpaid amount (±1% tolerance)' do
      # User paid 60,000 NGN instead of 70,000
      underpaid_payload = {
        event: 'charge.success',
        data: {
          reference: transaction_ref,
          status: 'success',
          amount: 6000000, # ~42 USD
          currency: 'NGN'
        }
      }.to_json
      underpaid_signature = OpenSSL::HMAC.hexdigest('SHA512', paystack_secret, underpaid_payload)

      post '/webhooks/paystack', params: underpaid_payload, headers: { 'X-Paystack-Signature' => underpaid_signature, 'Content-Type' => 'application/json' }
      
      expect(response).to have_http_status(:ok) # Webhook returns OK but logic should skip
      expect(deposit.reload.status).to eq('pending')
      expect(wallet.reload.balance).to eq(0.0)
    end
  end
end

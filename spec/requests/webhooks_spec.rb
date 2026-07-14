# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Webhooks', type: :request do
  describe 'POST /webhooks/rexpay' do
    let(:user) { User.create!(username: 'webhook_user', email: 'webhook@test.com', first_name: 'W', last_name: 'H', password: 'password123', country_code: 'US', city: 'New York') }
    let(:wallet) { user.wallet }
    let(:transaction_ref) { 'DEP_mock_123' }
    let!(:deposit) do
      Deposit.create!(
        depositable: user,
        amount: 50.0, # $50 USD
        gateway: 'rexpay',
        status: 'pending',
        metadata: { transaction_ref: transaction_ref, exchange_rate: 1400.0 }
      )
    end

    let(:payload) { { reference: transaction_ref }.to_json }
    let(:rexpay_service) { instance_double(RexpayService) }

    before do
      allow(RexpayService).to receive(:new).and_return(rexpay_service)
    end

    it 'verifies the charge server-side and credits the wallet' do
      # RexPay callbacks are unsigned, so the controller must confirm the
      # charge via getTransactionStatus before crediting anything.
      expect(rexpay_service).to receive(:verify_transaction).with(transaction_ref)
                                                            .and_return({ status: 'success', amount: 70_000.0, currency: 'NGN' })

      post '/webhooks/rexpay', params: payload, headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:ok)
      expect(deposit.reload.status).to eq('completed')
      expect(wallet.reload.balance).to be_within(0.01).of(50.0)

      # Verify Transaction record creation for the deposit
      txn = Transaction.find_by(reference: deposit)
      expect(txn).not_to be_nil
      expect(txn.payment_gateway).to eq('rexpay')
      expect(txn.transaction_type).to eq('credit')
      expect(txn.amount).to be_within(0.01).of(50.0)
    end

    it 'does not credit when server-side verification fails' do
      expect(rexpay_service).to receive(:verify_transaction).with(transaction_ref)
                                                            .and_return({ status: 'failed', error: 'Transaction Failed' })

      post '/webhooks/rexpay', params: payload, headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:ok)
      expect(deposit.reload.status).to eq('pending')
      expect(wallet.reload.balance).to eq(0.0)
    end

    it 'rejects a payload without a reference' do
      expect(rexpay_service).not_to receive(:verify_transaction)

      post '/webhooks/rexpay', params: {}.to_json, headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:bad_request)
      expect(deposit.reload.status).to eq('pending')
    end

    it 'rejects underpaid amount (±1% tolerance)' do
      # User paid 60,000 NGN instead of 70,000
      expect(rexpay_service).to receive(:verify_transaction).with(transaction_ref)
                                                            .and_return({ status: 'success', amount: 60_000.0, currency: 'NGN' })

      post '/webhooks/rexpay', params: payload, headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:ok) # Webhook returns OK but logic should skip
      expect(deposit.reload.status).to eq('pending')
      expect(wallet.reload.balance).to eq(0.0)
    end

    it 'redirects the payer to the frontend success page on GET callbacks' do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with('FRONTEND_URL').and_return('https://app.example.com')
      expect(rexpay_service).to receive(:verify_transaction).with(transaction_ref)
                                                            .and_return({ status: 'success', amount: 70_000.0, currency: 'NGN' })

      get '/webhooks/rexpay', params: {
        reference: transaction_ref,
        redirect_to: 'https://app.example.com/payments/success?payment=rexpay&type=deposit'
      }

      expect(response).to redirect_to('https://app.example.com/payments/success?payment=rexpay&type=deposit')
      expect(deposit.reload.status).to eq('completed')
    end

    it 'ignores redirect_to outside the frontend origin (open redirect guard)' do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with('FRONTEND_URL').and_return('https://app.example.com')
      expect(rexpay_service).to receive(:verify_transaction).with(transaction_ref)
                                                            .and_return({ status: 'success', amount: 70_000.0, currency: 'NGN' })

      get '/webhooks/rexpay', params: { reference: transaction_ref, redirect_to: 'https://evil.example.com/phish' }

      expect(response).to redirect_to('https://app.example.com')
    end
  end
end

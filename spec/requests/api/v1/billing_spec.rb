# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'api/v1/billing', type: :request do
  path '/api/v1/billing/balance' do
    get('Get Balance') do
      tags 'Billing'
      security [{ Bearer: [] }]
      produces 'application/json'

      response(200, 'successful') do
        schema type: :object,
               properties: {
                 balance: { type: :number },
                 earnings_balance: { type: :number },
                 currency: { type: :string }
               }

        let(:reseller) { Reseller.create!(username: 'partner_billing_summary', email: 'billing@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        run_test!
      end
    end
  end

  path '/api/v1/billing/transactions' do
    get('List Transactions') do
      tags 'Billing'
      security [{ Bearer: [] }]
      produces 'application/json'

      response(200, 'successful') do
        let(:reseller) { Reseller.create!(username: 'transaction_ledger', email: 'transactions@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        run_test!
      end
    end
  end

  path '/api/v1/billing/transfer_earnings' do
    post('Transfer Earnings to Balance') do
      tags 'Billing'
      security [{ Bearer: [] }]
      consumes 'application/json'
      produces 'application/json'
      description 'Moves accumulated referral or sale earnings into the active purchase balance.'

      parameter name: :transfer, in: :body, schema: {
        type: :object,
        properties: {
          amount: { type: :number, example: 50.0 }
        },
        required: ['amount']
      }

      response(200, 'successful') do
        let(:reseller) do
          r = Reseller.create!(username: 'earnings_manager', email: 'earnings@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York', reseller_type: 'infrastructure')
          AffiliateService.new(r).enrol!
          wallet = r.wallets.find_or_create_by!(wallet_type: 'earnings')
          wallet.credit!(100.0, 'Initial')
          r.update!(withdrawable_profit: 100.0)
          r.reload
        end
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        let(:transfer) { { amount: 50.0 } }
        run_test!
      end
    end
  end

  path '/api/v1/billing/request_payout' do
    post('Request Payout') do
      tags 'Billing'
      security [{ Bearer: [] }]
      consumes 'application/json'
      produces 'application/json'
      description 'Initiates a withdrawal request for earned commissions.'

      parameter name: :payout, in: :body, schema: {
        type: :object,
        properties: {
          amount: { type: :number, example: 100.0 },
          payment_method: { type: :string, example: 'bank_transfer' },
          payment_details: { type: :object }
        },
        required: %w[amount payment_method payment_details]
      }

      response(201, 'created') do
        let!(:reseller) do
          r = Reseller.create!(username: 'commission_withdraw', email: 'payouts@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York', reseller_type: 'infrastructure')
          AffiliateService.new(r).enrol!
          r.reload.affiliate.update!(total_earned: 500.0)
          wallet = r.wallets.find_or_create_by!(wallet_type: 'earnings')
          wallet.credit!(500.0, 'Initial')
          r.update!(withdrawable_profit: 500.0)
          r.reload
        end
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        let(:payout) { { amount: 100.0, payment_method: 'manual', payment_details: { bank: 'Example Bank', account: '123456' } } }
        run_test!
      end
    end
  end
end

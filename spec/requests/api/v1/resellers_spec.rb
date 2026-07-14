# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'api/v1/resellers', type: :request do
  path '/api/v1/resellers/{id}' do
    parameter name: :id, in: :path, type: :string

    get('Get Reseller Profile') do
      tags 'Reseller Profile'
      security [{ Bearer: [] }]
      produces 'application/json'

      response(200, 'successful') do
        let(:reseller) { Reseller.create!(username: 'partner_profile_view', email: 'profile@example.com', password: 'password', company_name: 'Strategic Solutions', country_code: 'US', city: 'New York') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        let(:id) { reseller.id }
        run_test!
      end
    end

    patch('Update Reseller Profile') do
      tags 'Reseller Profile'
      security [{ Bearer: [] }]
      consumes 'application/json'
      produces 'application/json'

      parameter name: :reseller, in: :body, schema: {
        type: :object,
        properties: {
          company_name: { type: :string, example: 'Updated Partner Corp' },
          email: { type: :string, example: 'new@example.com' }
        }
      }

      response(200, 'successful') do
        let(:reseller_obj) { Reseller.create!(username: 'partner_profile_edit', email: 'edit@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York') }
        let(:token) { JWT.encode({ reseller_id: reseller_obj.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        let(:id) { reseller_obj.id }
        let(:reseller) { { reseller: { company_name: 'New Company' } } }
        run_test!
      end
    end
  end

  path '/api/v1/resellers' do
    get('List Resellers') do
      tags 'Reseller Profile'
      security [{ Bearer: [] }]
      produces 'application/json'
      description 'Returns a paginated list of authorized partners.'

      response(200, 'successful') do
        let(:reseller) { Reseller.create!(username: 'partner_admin', email: 'admin@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        run_test!
      end
    end
  end

  path '/api/v1/resellers/{id}/deposit' do
    parameter name: :id, in: :path, type: :string

    post('Add Balance / Deposit') do
      tags 'Reseller Profile'
      security [{ Bearer: [] }]
      consumes 'application/json'
      produces 'application/json'
      description 'Initiates a wallet top-up through supported payment gateways.'

      parameter name: :deposit_data, in: :body, schema: {
        type: :object,
        properties: {
          amount: { type: :number, example: 1500.0 },
          gateway: { type: :string, example: 'rexpay' },
          currency: { type: :string, example: 'USD' }
        },
        required: %w[amount gateway]
      }

      response(200, 'successful') do
        let(:reseller) { Reseller.create!(username: 'partner_topup', email: 'topup@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        let(:id) { reseller.id }
        let(:deposit_data) { { amount: 1500.0, gateway: 'rexpay' } }

        before do
          allow(FixerService).to receive(:get_rate).and_return(1500.0)
          rexpay = instance_double(RexpayService)
          allow(RexpayService).to receive(:new).and_return(rexpay)
          allow(rexpay).to receive(:create_payment).and_return({ payment_url: 'https://rexpay.example/pay/abc' })
        end

        run_test!
      end
    end
  end

  path '/api/v1/resellers/{id}/rotate_dedicated_api_key' do
    parameter name: :id, in: :path, type: :string

    post('Rotate Dedicated API Key') do
      tags 'Reseller Profile'
      security [{ Bearer: [] }]
      produces 'application/json'
      description 'Infrastructure partners use this to cycle their static ps_live_... key for security audits.'

      response(200, 'successful') do
        let(:reseller) { Reseller.create!(username: 'partner_key_rotation', email: 'key_rotation@example.com', password: 'password', company_name: 'Test Company', reseller_type: 'infrastructure', country_code: 'US', city: 'New York') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        let(:id) { reseller.id }
        run_test!
      end
    end
  end
end

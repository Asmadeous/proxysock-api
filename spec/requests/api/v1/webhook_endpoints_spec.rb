# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'api/v1/webhook_endpoints', type: :request do
  path '/api/v1/webhook_endpoints' do
    get('List Webhook Endpoints') do
      tags 'Webhooks'
      security [{ Bearer: [] }]
      produces 'application/json'

      response(200, 'successful') do
        let(:reseller) { Reseller.create!(username: 'partner_event_listener', email: 'events@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        run_test!
      end
    end

    post('Create Webhook Endpoint') do
      tags 'Webhooks'
      security [{ Bearer: [] }]
      consumes 'application/json'
      produces 'application/json'

      parameter name: :webhook_endpoint, in: :body, schema: {
        type: :object,
        properties: {
          url: { type: :string, example: 'https://api.partner.com/webhooks/proxysock' },
          description: { type: :string, example: 'Main production listener' },
          events: {
            type: :array,
            items: { type: :string },
            example: ['order.completed', 'vm.provisioned']
          }
        },
        required: %w[url events]
      }

      response(201, 'created') do
        let(:reseller) { Reseller.create!(username: 'partner_v1_webhook', email: 'webhook_v1@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        let(:webhook_endpoint) { { url: 'https://api.partner.com/v1', events: ['order.completed'] } }
        run_test!
      end
    end
  end

  path '/api/v1/webhook_endpoints/{id}' do
    parameter name: :id, in: :path, type: :string

    put('Update Webhook Endpoint') do
      tags 'Webhooks'
      security [{ Bearer: [] }]
      consumes 'application/json'
      produces 'application/json'

      parameter name: :webhook_endpoint, in: :body, schema: {
        type: :object,
        properties: {
          url: { type: :string },
          events: { type: :array, items: { type: :string } }
        }
      }

      response(200, 'successful') do
        let(:reseller) { Reseller.create!(username: 'partner_endpoint_update', email: 'update@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        let(:endpoint_obj) { WebhookEndpoint.create!(reseller: reseller, url: 'https://old.com', events: []) }
        let(:id) { endpoint_obj.id }
        let(:webhook_endpoint) { { url: 'https://new.com' } }
        run_test!
      end
    end

    delete('Delete Webhook Endpoint') do
      tags 'Webhooks'
      security [{ Bearer: [] }]
      produces 'application/json'

      response(200, 'successful') do
        let(:reseller) { Reseller.create!(username: 'partner_endpoint_cleanup', email: 'cleanup@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        let(:endpoint_obj) { WebhookEndpoint.create!(reseller: reseller, url: 'https://delete-me.com', events: []) }
        let(:id) { endpoint_obj.id }
        run_test!
      end
    end
  end
end

# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'api/v1/tickets', type: :request do
  path '/api/v1/tickets' do
    get('List My Tickets') do
      tags 'Support Tickets'
      security [{ Bearer: [] }]
      produces 'application/json'

      response(200, 'successful') do
        let(:reseller) { Reseller.create!(username: 'partner_support_access', email: 'support@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        run_test!
      end
    end

    post('Create Support Ticket') do
      tags 'Support Tickets'
      security [{ Bearer: [] }]
      consumes 'application/json'
      produces 'application/json'

      parameter name: :ticket, in: :body, schema: {
        type: :object,
        properties: {
          subject: { type: :string, example: 'Resource provisioning delay' },
          priority: { type: :string, enum: %w[low medium high], example: 'medium' },
          message: { type: :string, example: 'My VPS order ORD-1234 is stuck in processing.' }
        },
        required: %w[subject priority message]
      }

      response(201, 'created') do
        let(:reseller) { Reseller.create!(username: 'partner_v1_ticket', email: 'v1_ticket@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        let(:product_category) { ProductCategory.create!(name: 'Test Category', category_type: 'proxy', active: true) }
        let(:product) { Product.create!(name: 'Test Product', product_type: 'proxy', available_to: 'both', active: true, product_category: product_category) }
        let(:pricing) { ProductPricing.create!(product: product, selling_price: 10.0, duration_type: 'monthly', duration_value: 1, active: true) }
        let(:order) { Order.create!(orderable: reseller, product: product, product_pricing: pricing, quantity: 1, status: 'active') }
        let(:ticket) { { subject: 'Integration help', priority: 'low', order_id: order.order_number, body: 'How do I verify signatures?' } }
        run_test!
      end
    end
  end

  path '/api/v1/tickets/{id}' do
    parameter name: :id, in: :path, type: :string

    get('Show Ticket Details') do
      tags 'Support Tickets'
      security [{ Bearer: [] }]
      produces 'application/json'

      response(200, 'successful') do
        let(:reseller) { Reseller.create!(username: 'ticket_detail_access', email: 'details@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        let(:ticket_obj) { Ticket.create!(user: reseller, subject: 'Issue', priority: 'medium', status: 'open') }
        let(:id) { ticket_obj.id }
        run_test!
      end
    end
  end

  path '/api/v1/tickets/{id}/reply' do
    parameter name: :id, in: :path, type: :string

    post('Reply to Ticket') do
      tags 'Support Tickets'
      security [{ Bearer: [] }]
      consumes 'application/json'
      produces 'application/json'

      parameter name: :reply, in: :body, schema: {
        type: :object,
        properties: {
          message: { type: :string, example: 'Understood, checking the logs now.' }
        },
        required: %w[message]
      }

      response(201, 'reply added') do
        let(:reseller) { Reseller.create!(username: 'ticket_reply_session', email: 'reply@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        let(:ticket_obj) { Ticket.create!(user: reseller, subject: 'Issue', priority: 'medium', status: 'open') }
        let(:id) { ticket_obj.id }
        let(:reply) { { message: 'This is my reply.' } }
        run_test!
      end
    end
  end
end

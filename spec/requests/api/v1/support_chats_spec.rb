# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'api/v1/support_chats', type: :request do
  path '/api/v1/support_chats' do
    get('List Active Support Chats') do
      tags 'Support Chat'
      security [{ Bearer: [] }]
      produces 'application/json'

      response(200, 'successful') do
        let(:reseller) { Reseller.create!(username: 'chat_partner', email: 'chat@example.com', password: 'password', company_name: 'Test Company') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        run_test!
      end
    end
  end

  path '/api/v1/support_chats/{id}' do
    parameter name: :id, in: :path, type: :string

    get('Show Chat History') do
      tags 'Support Chat'
      security [{ Bearer: [] }]
      produces 'application/json'

      response(200, 'successful') do
        let(:reseller) { Reseller.create!(username: 'chat_partner_2', email: 'chat2@example.com', password: 'password', company_name: 'Test Company') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        let(:chat) { SupportChat.create!(chatable: reseller) }
        let(:id) { chat.session_token }
        run_test!
      end
    end
  end

  path '/api/v1/support_chats/messages' do
    post('Send Message to Support') do
      tags 'Support Chat'
      security [{ Bearer: [] }]
      consumes 'application/json'
      produces 'application/json'

      parameter name: :message_data, in: :body, schema: {
        type: :object,
        properties: {
          message: { type: :string, example: 'I need assistance with my new VPS instance.' }
        },
        required: ['message']
      }

      response(201, 'message sent') do
        let(:reseller) { Reseller.create!(username: 'chat_partner_3', email: 'chat3@example.com', password: 'password', company_name: 'Test Company') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        let(:message_data) { { message: 'Hello Support!' } }
        run_test!
      end
    end
  end
end

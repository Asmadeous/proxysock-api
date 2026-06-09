# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'api/v1/auth', type: :request do
  let(:Authorization) { 'Bearer dummy' }
  path '/api/v1/auth/token' do
    post('Generate Rotational Token') do
      tags 'Authentication'
      consumes 'application/json'
      produces 'application/json'
      description 'API Only resellers use this to exchange their Permanent API Key for a single-use JWT. Enterprise resellers use their Dedicated API Key directly and do not need this.'

      parameter name: :credentials, in: :body, schema: {
        type: :object,
        properties: {
          username: { type: :string, example: 'partner_76' },
          api_key: { type: :string, example: 'd7ad81d7832f16487eec8fb5ec4315b5...' }
        },
        required: %w[username api_key]
      }

      response(200, 'successful') do
        schema type: :object,
               properties: {
                 message: { type: :string },
                 token: { type: :string },
                 refresh_token: { type: :string },
                 reseller: {
                   type: :object,
                   properties: {
                     username: { type: :string },
                     reseller_type: { type: :string }
                   }
                 }
               }

        let(:reseller) { Reseller.create!(username: 'partner_credential_access', email: 'partner_auth@example.com', password: 'password', company_name: 'Test Company', reseller_type: 'api_only', permanent_api_key: 'secure_integration_key', country_code: 'US', city: 'New York', email_verified_at: Time.current) }
        let(:credentials) { { username: reseller.username, api_key: reseller.permanent_api_key } }
        run_test!
      end

      response(401, 'invalid credentials') do
        let(:credentials) { { username: 'invalid', api_key: 'invalid' } }
        run_test!
      end
    end
  end

  path '/api/v1/auth/me' do
    get('Current Reseller Profile') do
      tags 'Authentication'
      security [{ Bearer: [] }]
      produces 'application/json'

      response(200, 'successful') do
        let(:reseller) { Reseller.create!(username: 'partner_session_user', email: 'session@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York') }
        let(:token) { reseller.generate_rotating_token }
        let(:Authorization) { "Bearer #{token}" }
        run_test!
      end
    end
  end

  path '/api/v1/auth/login' do
    post('Standard Dashboard Login') do
      tags 'Authentication'
      consumes 'application/json'
      produces 'application/json'
      description 'Authenticates a reseller using email and password for dashboard access.'

      parameter name: :login_data, in: :body, schema: {
        type: :object,
        properties: {
          email: { type: :string, example: 'partner@example.com' },
          password: { type: :string, example: 'password' }
        },
        required: %w[email password]
      }

      response(200, 'successful') do
        let(:reseller) { Reseller.create!(username: 'dashboard_user', email: 'dash@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York', email_verified_at: Time.current) }
        let(:login_data) { { email: reseller.email, password: 'password' } }
        run_test!
      end
    end
  end

  path '/api/v1/auth/refresh' do
    post('Refresh Session Token') do
      tags 'Authentication'
      consumes 'application/json'
      produces 'application/json'

      parameter name: :refresh_data, in: :body, schema: {
        type: :object,
        properties: {
          refresh_token: { type: :string }
        },
        required: ['refresh_token']
      }

      response(200, 'successful') do
        let(:reseller) { Reseller.create!(username: 'refresh_user', email: 'refresh@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York') }
        let(:token) { reseller.generate_rotating_token }
        let(:Authorization) { "Bearer #{token}" }
        let(:refresh_data) { { refresh_token: 'valid_refresh_token' } }
        run_test!
      end
    end
  end

  path '/api/v1/auth/zoho_callback' do
    post('Zoho Integration Callback') do
      tags 'Authentication'
      description 'Internal callback for Zoho CRM synchronization.'
      response(200, 'successful') do
        run_test!
      end
    end
  end
end

# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'api/v1/notifications', type: :request do
  path '/api/v1/notifications' do
    get('List My Notifications') do
      tags 'Notifications'
      security [{ Bearer: [] }]
      produces 'application/json'

      response(200, 'successful') do
        let(:reseller) { Reseller.create!(username: 'notif_center', email: 'alerts@example.com', password: 'password', company_name: 'Test Company') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        run_test!
      end
    end
  end

  path '/api/v1/notifications/mark_as_read' do
    post('Mark All as Read') do
      tags 'Notifications'
      security [{ Bearer: [] }]
      produces 'application/json'

      response(200, 'successful') do
        let(:reseller) { Reseller.create!(username: 'notif_center', email: 'alerts@example.com', password: 'password', company_name: 'Test Company') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        run_test!
      end
    end
  end
end

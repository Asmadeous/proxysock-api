# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Web::Api::Auth SSO', type: :request do
  let(:frontend_url) { 'http://localhost:3001' }

  before do
    OmniAuth.config.test_mode = true
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with('FRONTEND_URL', 'http://localhost:3001').and_return(frontend_url)
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with('FRONTEND_URL').and_return(frontend_url)
  end

  describe 'GET /web/api/auth/google_callback' do
    let(:google_auth_hash) do
      OmniAuth::AuthHash.new({
                               provider: 'google_oauth2',
                               uid: '123456',
                               info: {
                                 email: 'testuser@example.com',
                                 first_name: 'Test',
                                 last_name: 'User',
                                 name: 'Test User'
                               }
                             })
    end

    before do
      OmniAuth.config.mock_auth[:google_oauth2] = google_auth_hash
      Rails.application.env_config['omniauth.auth'] = google_auth_hash
    end

    context 'when user does not exist' do
      it 'creates a new user with a generated username and redirects to frontend' do
        expect do
          get '/web/api/auth/google/callback'
        end.to change(User, :count).by(1)

        user = User.find_by!(email: 'testuser@example.com')
        expect(user.email).to eq('testuser@example.com')
        expect(user.username).to eq('testuser')
        expect(user.status).to eq('active')

        expect(response).to redirect_to(%r{#{frontend_url}/auth/callback\?auth_token=.*})
      end
    end

    context 'when user already exists' do
      let!(:existing_user) do
        User.create!(
          email: 'testuser@example.com',
          username: 'existing_one',
          first_name: 'Existing',
          last_name: 'User',
          password: 'password123'
        )
      end

      it 'links the provider and redirects to frontend' do
        expect do
          get '/web/api/auth/google/callback'
        end.not_to change(User, :count)

        existing_user.reload
        expect(existing_user.provider).to eq('google_oauth2')
        expect(existing_user.uid).to eq('123456')

        expect(response).to redirect_to(%r{#{frontend_url}/auth/callback\?auth_token=.*})
      end
    end

    context 'when username conflict exists' do
      let!(:other_user) do
        User.create!(
          email: 'other@example.com',
          username: 'testuser',
          first_name: 'Other',
          last_name: 'User',
          password: 'password123'
        )
      end

      it 'generates a unique username and creates the user' do
        expect do
          get '/web/api/auth/google/callback'
        end.to change(User, :count).by(1)

        user = User.find_by!(email: 'testuser@example.com')
        expect(user.username).to start_with('testuser_')
      end
    end
  end

  describe 'GET /admin/api/auth/zoho/callback' do
    let(:zoho_auth_hash) do
      OmniAuth::AuthHash.new({
                               provider: 'zoho',
                               uid: 'zoho123',
                               info: {
                                 email: 'admin@example.com',
                                 first_name: 'Admin',
                                 last_name: 'User'
                               }
                             })
    end

    let!(:employee) do
      Employee.create!(
        email: 'admin@example.com',
        first_name: 'Admin',
        last_name: 'User',
        password: 'password123',
        department: Department.find_or_create_by(name: 'General'),
        role: 'support'
      )
    end

    before do
      OmniAuth.config.mock_auth[:zoho] = zoho_auth_hash
      Rails.application.env_config['omniauth.auth'] = zoho_auth_hash
      allow(Employee).to receive(:from_omniauth).and_return(employee)
    end

    it 'redirects to frontend with target /admin' do
      get '/admin/api/auth/zoho/callback'
      expect(response).to redirect_to(%r{#{frontend_url}/auth/callback\?auth_token=.*target=/admin})
    end
  end
end

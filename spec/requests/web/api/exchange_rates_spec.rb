# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Web::Api::ExchangeRates', type: :request do
  describe 'GET /show' do
    it 'returns http success' do
      get '/web/api/exchange_rates/show'
      expect(response).to have_http_status(:success)
    end
  end
end

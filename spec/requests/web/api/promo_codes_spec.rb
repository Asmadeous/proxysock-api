require 'rails_helper'

RSpec.describe 'Web::Api::PromoCodes', type: :request do
  let!(:active_promo) { PromoCode.create!(code: 'TEST20', discount_type: 'percentage', discount_value: 20, active: true) }
  let!(:inactive_promo) { PromoCode.create!(code: 'EXPIRED10', discount_type: 'fixed', discount_value: 10, active: false) }

  describe 'POST /web/api/promo_codes/validate' do
    it 'validates an active code and returns its details' do
      post '/web/api/promo_codes/validate', params: { code: 'test20' }, as: :json
      
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['valid']).to be true
      expect(json['code']).to eq 'TEST20'
      expect(json['discount_type']).to eq 'percentage'
      expect(json['discount_value'].to_f).to eq 20.0
    end

    it 'rejects an inactive code' do
      post '/web/api/promo_codes/validate', params: { code: 'EXPIRED10' }, as: :json
      
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['valid']).to be false
      expect(json['error']).to eq 'This promo code is no longer active'
    end

    it 'rejects a nonexistent code' do
      post '/web/api/promo_codes/validate', params: { code: 'BOGUS' }, as: :json
      
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['valid']).to be false
      expect(json['error']).to eq 'Invalid promo code'
    end
  end
end

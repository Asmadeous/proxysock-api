# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Webhooks::EsimAccess', type: :request do
  describe 'POST /webhooks/esim_access' do
    let(:orderable) { create(:user) }
    let(:product) { create(:product, :esim, provider: 'esim_access') }
    let(:order) { create(:order, orderable: orderable, product: product) }
    let(:esim_order) { create(:esim_order, order: order, provider_order_no: 'B22102010075311') }

    before do
      esim_order
    end

    it 'handles CHECK_HEALTH' do
      post '/webhooks/esim_access', params: { notifyType: 'CHECK_HEALTH', content: {} }
      expect(response).to have_http_status(:success)
      expect(JSON.parse(response.body)['success']).to be true
    end

    it 'handles ORDER_STATUS' do
      expect do
        post '/webhooks/esim_access', params: {
          notifyType: 'ORDER_STATUS',
          content: {
            orderNo: 'B22102010075311',
            iccid: '8900000000000000000',
            smdpStatus: 'RELEASED',
            esimStatus: 'GOT_RESOURCE',
            matchingId: '1$smdp.com$matchingId'
          }
        }
      end.to have_enqueued_job(ActionMailer::MailDeliveryJob)

      expect(response).to have_http_status(:success)
      esim_order.reload
      expect(esim_order.status).to eq('completed')
      esim = Esim.find_by(iccid: '8900000000000000000')
      expect(esim).to be_present
      expect(esim.activation_code).to eq('1$smdp.com$matchingId')
    end
  end
end

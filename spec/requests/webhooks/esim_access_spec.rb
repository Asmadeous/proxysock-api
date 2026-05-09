# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Webhooks::EsimAccess', type: :request do
  describe 'POST /webhooks/esim_access' do
    let(:orderable) { User.create!(email: 'tester@example.com', username: 'testeresim', password: 'password', first_name: 'Test', last_name: 'User', country_code: 'US', city: 'New York') }
    let(:category) { ProductCategory.create!(name: 'eSIMs', slug: 'esims') }
    let(:product) { Product.create!(name: 'esim prod', product_type: 'esim', provider: 'esim_access', product_category: category) }
    let(:pricing) { ProductPricing.create!(product: product, selling_price: 10.0, active: true, currency: 'USD') }
    let(:order) { Order.create!(orderable: orderable, product: product, product_pricing: pricing, order_number: 'E-123') }
    let(:esim_order) { EsimOrder.create!(order: order, provider_order_no: 'B22102010075311') }

    before do
      ActiveJob::Base.queue_adapter = :test
      esim_order
    end

    it 'handles CHECK_HEALTH' do
      post '/esim', params: { notifyType: 'CHECK_HEALTH', content: {} }, as: :json
      expect(response).to have_http_status(:success)
      expect(JSON.parse(response.body)['success']).to be true
    end

    it 'handles ORDER_STATUS' do
      mock_client = double('EsimAccessService')
      allow(EsimAccessService).to receive(:new).and_return(mock_client)
      allow(mock_client).to receive(:fetch_profiles_by_order).with('B22102010075311').and_return([
        {
          'iccid' => '8900000000000000000',
          'imsi' => '208000000000000',
          'smdpStatus' => 'RELEASED',
          'esimStatus' => 'GOT_RESOURCE',
          'ac' => '1$smdp.com$matchingId',
          'totalVolume' => 1000000
        }
      ])

      expect do
        post '/esim', params: {
          notifyType: 'ORDER_STATUS',
          content: {
            orderNo: 'B22102010075311',
            iccid: '8900000000000000000',
            smdpStatus: 'RELEASED',
            esimStatus: 'GOT_RESOURCE',
            matchingId: '1$smdp.com$matchingId'
          }
        }, as: :json
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

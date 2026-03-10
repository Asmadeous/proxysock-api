# frozen_string_literal: true

require 'rails_helper'

RSpec.describe EsimAccessService do
  let(:api_key) { 'test_api_key' }
  let(:secret_key) { 'test_secret_key' }
  let(:service) { EsimAccessService.new }

  before do
    allow(ENV).to receive(:fetch).with('ESIM_ACCESS_API_KEY', any_args).and_return(api_key)
    allow(ENV).to receive(:fetch).with('ESIM_ACCESS_SECRET_KEY', any_args).and_return(secret_key)
  end

  describe '#order_esim' do
    let(:package_code) { 'GLOBAL_1GB_30D' }
    let(:mock_response) do
      {
        'success' => true,
        'obj' => {
          'orderNo' => 'ESIM_12345',
          'packageList' => [{ 'packageCode' => package_code, 'iccid' => '898600000000000001' }]
        }
      }
    end

    it 'sends a signed POST request to /order/profiles' do
      # We need to catch the dynamic transactionId generated in the method
      expect_any_instance_of(Net::HTTP).to receive(:request) do |http, req|
        expect(req.path).to eq('/api/v1/open/esim/order')
        expect(req['RT-AccessCode']).to eq(api_key)
        
        body = JSON.parse(req.body)
        expect(body['packageInfoList'].first['packageCode']).to eq(package_code)
        
        # Verify signature
        timestamp  = req['RT-Timestamp']
        request_id = req['RT-RequestID']
        sign_data  = "#{timestamp}#{request_id}#{api_key}#{req.body}"
        expected_sig = OpenSSL::HMAC.hexdigest('SHA256', secret_key, sign_data)
        expect(req['RT-Signature']).to eq(expected_sig)

        double('response', code: '200', body: mock_response.to_json, is_a?: true)
      end

      result = service.order_esim(package_code)
      expect(result['orderNo']).to eq('ESIM_12345')
      expect(result['transactionId']).to be_present
    end

    it 'raises an error if the API returns success: false' do
      error_response = { 'success' => false, 'errorCode' => '1001', 'errorMessage' => 'Invalid Package' }
      allow_any_instance_of(Net::HTTP).to receive(:request).and_return(
        double('response', code: '200', body: error_response.to_json, is_a?: true)
      )

      expect { service.order_esim(package_code) }.to raise_error(/eSIM Access Order Failed: Invalid Package/)
    end
  end

  describe '#list_packages' do
    it 'sends a GET request and returns the obj array' do
      mock_pkg_response = { 'success' => true, 'obj' => { 'packageList' => [{ 'packageCode' => 'PKG1' }] } }
      allow_any_instance_of(Net::HTTP).to receive(:request).and_return(
        double('response', code: '200', body: mock_pkg_response.to_json, is_a?: true)
      )

      expect(service.list_packages).to eq([{ 'packageCode' => 'PKG1' }])
    end
  end
end

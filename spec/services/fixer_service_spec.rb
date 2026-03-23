# frozen_string_literal: true

require 'rails_helper'

RSpec.describe FixerService do
  let(:api_key) { 'test_key' }
  let(:base_url) { "http://data.fixer.io/api/latest?access_key=#{api_key}&symbols=USD,NGN" }

  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:[]).with('FIXER_API_KEY').and_return(api_key)
    allow(ENV).to receive(:fetch).with('PAYSTACK_NGN_USD_RATE', '1500').and_return(1500.0)
    Rails.cache.clear
  end

  describe '.get_rate' do
    context 'when API call is successful' do
      let(:mock_response) do
        {
          'success' => true,
          'rates' => {
            'USD' => 1.05,
            'NGN' => 1460.0
          }
        }.to_json
      end

      # before do
      #   allow(Net::HTTP).to receive(:get).with(URI(base_url)).and_return(mock_response)
      # end

      it 'calculates the correct cross-rate (NGN/USD)' do
        expect(Net::HTTP).to receive(:get).with(URI(base_url)).and_return(mock_response)
        # NGN/EUR / USD/EUR = 1460.0 / 1.05 = 1390.47619...
        expected_rate = 1460.0 / 1.05
        expect(FixerService.get_rate('USD', 'NGN')).to be_within(0.001).of(expected_rate)
      end

      it 'caches the result for 24 hours' do
        expect(Net::HTTP).to receive(:get).with(URI(base_url)).and_return(mock_response).once
        FixerService.get_rate('USD', 'NGN')
        FixerService.get_rate('USD', 'NGN')
      end
    end

    context 'when API fails' do
      before do
        expect(Net::HTTP).to receive(:get).and_return({ 'success' => false }.to_json)
      end

      it 'falls back to the environment variable rate' do
        allow(ENV).to receive(:fetch).with('PAYSTACK_NGN_USD_RATE', '1500').and_return('1550')
        expect(FixerService.get_rate('USD', 'NGN')).to eq(1550.0)
      end
    end
  end
end

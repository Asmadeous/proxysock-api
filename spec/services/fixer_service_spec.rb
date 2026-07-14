# frozen_string_literal: true

require 'rails_helper'

RSpec.describe FixerService do
  let(:api_key) { 'test_key' }
  let(:base_url) { "http://data.fixer.io/api/latest?access_key=#{api_key}&symbols=USD,NGN" }

  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with('FIXER_API_KEY').and_return(api_key)
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
      it 'raises RateUnavailableError instead of using a fallback rate' do
        expect(Net::HTTP).to receive(:get).and_return({ 'success' => false }.to_json)
        expect { FixerService.get_rate('USD', 'NGN') }.to raise_error(FixerService::RateUnavailableError)
      end
    end

    context 'when the API key is missing' do
      it 'raises RateUnavailableError' do
        allow(ENV).to receive(:[]).with('FIXER_API_KEY').and_return(nil)
        expect { FixerService.get_rate('USD', 'NGN') }.to raise_error(FixerService::RateUnavailableError)
      end
    end
  end
end

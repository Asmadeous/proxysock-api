# frozen_string_literal: true

require 'rails_helper'

RSpec.describe XProxyUsageJob, type: :job do
  describe '#perform' do
    let(:service_mock) { instance_double(XProxyService) }

    before do
      allow(XProxyService).to receive(:new).and_return(service_mock)
      allow(service_mock).to receive(:sync_proxies)
      allow(service_mock).to receive(:cleanup_expired)
    end

    it 'calls sync_proxies and cleanup_expired on XProxyService' do
      described_class.new.perform

      expect(service_mock).to have_received(:sync_proxies)
      expect(service_mock).to have_received(:cleanup_expired)
    end
  end
end

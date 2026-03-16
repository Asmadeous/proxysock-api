# frozen_string_literal: true

require 'rails_helper'

RSpec.describe XProxyService, type: :service do
  subject(:service) { described_class.new(logger) }

  let(:logger) { instance_double(ActiveSupport::Logger, info: nil, error: nil) }

  # Helper: stub a single HTTP response from the XProxy API
  def stub_request_response(method, _path, body)
    response = instance_double(Net::HTTPSuccess, code: '200', body: body.to_json)
    allow(response).to receive(:is_a?).with(Net::HTTPSuccess).and_return(true)

    http = instance_double(Net::HTTP)
    allow(Net::HTTP).to receive(:new).and_return(http)
    allow(http).to receive(:use_ssl=)
    allow(http).to receive(:request).and_return(response)

    req_class = {
      get: Net::HTTP::Get,
      post: Net::HTTP::Post,
      delete: Net::HTTP::Delete
    }.fetch(method)
    req = instance_double(req_class)
    allow(req_class).to receive(:new).and_return(req) if [Net::HTTP::Get, Net::HTTP::Post, Net::HTTP::Delete].include?(req_class)
    allow(req).to receive(:basic_auth)
    allow(req).to receive(:[]=)
    allow(req).to receive(:body=)
  end

  # Build a fake device hash as returned by GET /api/v1/info_list
  def fake_device(overrides = {})
    {
      'position' => 1,
      'host' => '74.208.234.109',
      'proxy_port' => 4001,
      'socks5_port' => 4001,
      'public_ip' => '113.185.76.192',
      'last_rotation' => nil,
      'device_manufacture' => 'XProxy-Hilink',
      'device_imei' => '353899262396854',
      'device_extra_info' => {
        'provider' => 'Bell',
        'provider_id' => '4',
        'connected' => true,
        'sim_live' => true,
        'signal_strength' => 5,
        'network_mode' => '4G'
      }
    }.merge(overrides)
  end

  # ──────────────────────────────────────────────────────────────────────────────
  # sync_proxies
  # ──────────────────────────────────────────────────────────────────────────────
  describe '#sync_proxies' do
    context 'when the API returns a single page of results' do
      before do
        page1_response = { 'total' => 1, 'data' => [fake_device] }
        allow(service).to receive(:request)
          .with(:get, '/api/v1/info_list?page=1&limit=50')
          .and_return(page1_response)

        allow(ProxyInstance).to receive(:find_or_initialize_by).and_return(
          instance_double(ProxyInstance, new_record?: true, assign_attributes: nil, save!: nil, status: 'available')
        )
      end

      it 'returns sync stats with fetched count' do
        stats = service.sync_proxies
        expect(stats[:fetched]).to eq(1)
      end

      it 'does not request page 2' do
        service.sync_proxies
        expect(service).not_to have_received(:request).with(:get, '/api/v1/info_list?page=2&limit=50')
      end
    end

    context 'when the API returns multiple pages' do
      before do
        device_a = fake_device('proxy_port' => 4001)
        device_b = fake_device('proxy_port' => 4002)

        allow(service).to receive(:request)
          .with(:get, '/api/v1/info_list?page=1&limit=50')
          .and_return({ 'total' => 2, 'data' => [device_a] })

        allow(service).to receive(:request)
          .with(:get, '/api/v1/info_list?page=2&limit=50')
          .and_return({ 'total' => 2, 'data' => [device_b] })

        allow(ProxyInstance).to receive(:find_or_initialize_by).and_return(
          instance_double(ProxyInstance, new_record?: true, assign_attributes: nil, save!: nil, status: 'available')
        )
      end

      it 'fetches all pages and accumulates count' do
        stats = service.sync_proxies
        expect(stats[:fetched]).to eq(2)
      end
    end

    context 'when the API returns invalid data' do
      before do
        allow(service).to receive(:request).and_return({ 'error' => 'oops' })
      end

      it 'does not raise but logs the event' do
        expect { service.sync_proxies }.not_to raise_error
      end
    end
  end

  # ──────────────────────────────────────────────────────────────────────────────
  # process_proxy (private — tested via sync_proxies)
  # ──────────────────────────────────────────────────────────────────────────────
  describe 'process_proxy (via sync_proxies)' do
    let(:proxy_double) do
      instance_double(ProxyInstance,
                      new_record?: true, assign_attributes: nil, save!: nil, status: 'available')
    end

    before do
      allow(service).to receive(:request)
        .and_return({ 'total' => 1, 'data' => [fake_device] })
      allow(ProxyInstance).to receive(:find_or_initialize_by).and_return(proxy_double)
    end

    it 'uses data["host"] for the proxy address, not a hardcoded IP' do
      service.sync_proxies
      expect(ProxyInstance).to have_received(:find_or_initialize_by)
        .with(proxy_address: '74.208.234.109:4001')
    end

    it 'uses Ruby String#downcase, not JavaScript toLowerCase (no NoMethodError)' do
      expect { service.sync_proxies }.not_to raise_error
    end

    it 'stores signal_strength and network_mode from device_extra_info in metadata' do
      captured_metadata = nil
      allow(proxy_double).to receive(:assign_attributes) { |attrs| captured_metadata = attrs[:metadata] }

      service.sync_proxies

      expect(captured_metadata[:signal_strength]).to eq(5)
      expect(captured_metadata[:network_mode]).to eq('4G')
    end

    it 'maps Bell provider to isp_id 4' do
      captured_metadata = nil
      allow(proxy_double).to receive(:assign_attributes) { |attrs| captured_metadata = attrs[:metadata] }

      service.sync_proxies

      expect(captured_metadata[:isp]).to eq('bell')
      expect(captured_metadata[:isp_id]).to eq('4')
    end

    context 'when host field is missing from API response' do
      before do
        allow(service).to receive(:request)
          .and_return({ 'total' => 1, 'data' => [fake_device.merge('host' => nil)] })
      end

      it 'falls back to BASE_URL host' do
        service.sync_proxies
        expect(ProxyInstance).to have_received(:find_or_initialize_by)
          .with(proxy_address: a_string_matching(/:4001$/))
      end
    end
  end

  # ──────────────────────────────────────────────────────────────────────────────
  # rotate_ip
  # ──────────────────────────────────────────────────────────────────────────────
  describe '#rotate_ip' do
    let(:proxy_address) { '74.208.234.109:4001' }

    before do
      allow(service).to receive(:request)
        .with(:get, "/api/v1/rotate_ip/proxy/#{proxy_address}")
        .and_return({ 'status' => true, 'msg' => 'command_sent' })
    end

    it 'calls the correct API endpoint' do
      service.rotate_ip(proxy_address)
      expect(service).to have_received(:request)
        .with(:get, "/api/v1/rotate_ip/proxy/#{proxy_address}")
    end

    it 'returns the API response hash' do
      result = service.rotate_ip(proxy_address)
      expect(result).to eq({ 'status' => true, 'msg' => 'command_sent' })
    end
  end

  # ──────────────────────────────────────────────────────────────────────────────
  # reboot_dongle
  # ──────────────────────────────────────────────────────────────────────────────
  describe '#reboot_dongle' do
    let(:proxy_address) { '74.208.234.109:4001' }

    before do
      allow(service).to receive(:request)
        .with(:get, "/api/v1/reboot/proxy/#{proxy_address}")
        .and_return({ 'status' => true, 'msg' => 'Modem reboot successfully!' })
    end

    it 'calls the correct API endpoint' do
      service.reboot_dongle(proxy_address)
      expect(service).to have_received(:request)
        .with(:get, "/api/v1/reboot/proxy/#{proxy_address}")
    end

    it 'returns the API response hash' do
      result = service.reboot_dongle(proxy_address)
      expect(result['msg']).to eq('Modem reboot successfully!')
    end
  end

  # ──────────────────────────────────────────────────────────────────────────────
  # request (private helper)
  # ──────────────────────────────────────────────────────────────────────────────
  describe 'request helper' do
    it 'raises ArgumentError for unsupported HTTP methods' do
      expect { service.send(:request, :patch, '/any') }
        .to raise_error(ArgumentError, /Unsupported HTTP method/)
    end
  end
end

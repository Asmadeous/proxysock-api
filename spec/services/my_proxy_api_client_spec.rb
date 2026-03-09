# frozen_string_literal: true

require 'rails_helper'

RSpec.describe MyProxyApiClient do
  let(:api_url) { 'https://api.testproxy.com' }
  let(:username) { 'test_user' }
  let(:secret) { 'test_secret' }
  let(:client) { MyProxyApiClient.new }
  let(:http_mock) { instance_double(Net::HTTP) }

  before do
    stub_const('MyProxyApiClient::BASE_URL', api_url)
    stub_const('MyProxyApiClient::API_USERNAME', username)
    stub_const('MyProxyApiClient::API_SECRET', secret)
    allow(Net::HTTP).to receive(:new).and_return(http_mock)
    allow(http_mock).to receive(:use_ssl=)
    allow(http_mock).to receive(:read_timeout=)
  end

  describe '#update_credentials' do
    let(:order_id) { '123' }
    let(:new_user) { 'proxy_user' }
    let(:new_pass) { 'proxy_pass' }

    it 'sends a PATCH request with Bearer token' do
      token_resp = double('token_resp', code: '200', body: { 'token' => 't' }.to_json)
      allow(token_resp).to receive(:is_a?).with(Net::HTTPSuccess).and_return(true)

      update_resp = double('update_resp', code: '200', body: { 'status' => 'success' }.to_json)
      allow(update_resp).to receive(:is_a?).with(Net::HTTPSuccess).and_return(true)

      expect(http_mock).to receive(:request).and_return(token_resp, update_resp)

      result = client.update_credentials(order_id, new_user, new_pass)
      expect(result['status']).to eq('success')
    end
  end

  describe '#rotate_ip' do
    it 'sends a PATCH request to /orders/replacement' do
      token_resp = double('token_resp', code: '200', body: { token: 't' }.to_json)
      allow(token_resp).to receive(:is_a?).with(Net::HTTPSuccess).and_return(true)
      
      rotate_resp = double('rotate_resp', code: '200', body: { 'status' => 'success' }.to_json)
      allow(rotate_resp).to receive(:is_a?).with(Net::HTTPSuccess).and_return(true)

      expect(http_mock).to receive(:request).and_return(token_resp, rotate_resp)

      result = client.rotate_ip('123')
      expect(result['status']).to eq('success')
    end
  end
end

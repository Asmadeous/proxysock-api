# frozen_string_literal: true

require 'net/http'
require 'uri'
require 'json'

class CloudflareDnsService
  BASE_URL = 'https://api.cloudflare.com/client/v4'

  def initialize
    @api_token = ENV['CLOUDFLARE_API_TOKEN']
    @zone_id = ENV['CLOUDFLARE_ZONE_ID']
    @base_domain = ENV['CLOUDFLARE_BASE_DOMAIN'] # e.g., proxysock.net
    @logger = Rails.logger
  end

  def create_vm_record(vm_id, ip_address, port, protocol)
    return unless enabled?

    subdomain = "vm-#{vm_id}"
    full_name = "#{subdomain}.#{@base_domain}"

    @logger.info("[CloudflareDnsService] Creating DNS record for #{full_name} -> #{ip_address}")

    # 1. Create A Record
    create_a_record(subdomain, ip_address)

    # 2. Create SRV Record (to "hide" the port)
    # Service: _ssh or _rdp
    service_name = protocol == 'rdp' ? '_rdp' : '_ssh'
    create_srv_record(service_name, subdomain, port)

    full_name
  end

  def create_a_record(subdomain, ip_address)
    uri = URI("#{BASE_URL}/zones/#{@zone_id}/dns_records")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    request = Net::HTTP::Post.new(uri)
    request['Authorization'] = "Bearer #{@api_token}"
    request['Content-Type'] = 'application/json'

    request.body = {
      type: 'A',
      name: subdomain,
      content: ip_address,
      ttl: 3600,
      proxied: false
    }.to_json

    http.request(request)
  end

  def create_srv_record(service, subdomain, port)
    uri = URI("#{BASE_URL}/zones/#{@zone_id}/dns_records")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    request = Net::HTTP::Post.new(uri)
    request['Authorization'] = "Bearer #{@api_token}"
    request['Content-Type'] = 'application/json'

    # SRV format: _service._proto.name
    request.body = {
      type: 'SRV',
      data: {
        service: service,
        proto: '_tcp',
        name: subdomain,
        priority: 10,
        weight: 5,
        port: port,
        target: "#{subdomain}.#{@base_domain}"
      }
    }.to_json

    http.request(request)
  end

  def delete_vm_record(vm_id)
    return unless enabled?

    subdomain = "vm-#{vm_id}"
    @logger.info("[CloudflareDnsService] Deleting DNS records for #{subdomain}")

    # Find and delete all records (A and SRV) associated with this subdomain
    record_ids = find_all_record_ids(subdomain)
    record_ids.each do |id|
      delete_record(id)
    end
    true
  end

  private

  def delete_record(record_id)
    uri = URI("#{BASE_URL}/zones/#{@zone_id}/dns_records/#{record_id}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    request = Net::HTTP::Delete.new(uri)
    request['Authorization'] = "Bearer #{@api_token}"
    http.request(request)
  end

  def find_all_record_ids(subdomain)
    # Search for any record containing the subdomain
    uri = URI("#{BASE_URL}/zones/#{@zone_id}/dns_records?name=contains:#{subdomain}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    request = Net::HTTP::Get.new(uri)
    request['Authorization'] = "Bearer #{@api_token}"

    response = http.request(request)
    result = JSON.parse(response.body)

    if result['success']
      result['result'].map { |r| r['id'] }
    else
      []
    end
  end

  def enabled?
    @api_token.present? && @zone_id.present? && @base_domain.present?
  end
end

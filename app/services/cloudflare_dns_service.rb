# frozen_string_literal: true

require 'net/http'
require 'uri'
require 'json'

class CloudflareDnsService
  BASE_URL = 'https://api.cloudflare.com/client/v4'

  def initialize(logger = Rails.logger)
    @api_token = ENV['CLOUDFLARE_API_TOKEN']&.strip&.delete("\"'")
    @zone_id = ENV['CLOUDFLARE_ZONE_ID']&.strip&.delete("\"'")
    domain = ENV['CLOUDFLARE_BASE_DOMAIN']&.strip&.delete("\"'")
    @base_domain = domain.present? ? domain : 'proxysock.com'
    @logger = logger
  end

  # Create A record: hostname.proxysock.com -> ip_address
  # Returns the full DNS name or nil on failure
  def create_vm_dns(hostname, ip_address)
    return nil unless enabled?

    full_name = "#{hostname}.#{@base_domain}"
    @logger.info("[CloudflareDNS] Creating A record: #{full_name} -> #{ip_address}")

    # Delete any existing record for this hostname first (idempotent)
    delete_vm_dns(hostname)

    response = cf_post("/zones/#{@zone_id}/dns_records", {
                         type: 'A',
                         name: hostname,
                         content: ip_address,
                         ttl: 120, # 2 min TTL for fast updates
                         proxied: false # DNS-only — RDP doesn't work through CF proxy
                       })

    if response['success']
      record_id = response.dig('result', 'id')
      @logger.info("[CloudflareDNS] Created A record #{full_name} (ID: #{record_id})")
      full_name
    else
      # If there is a full error hash, extract the messages.
      errors = response['errors']&.map { |e| "[#{e['code']}] #{e['message']}" }&.join(', ') || response.to_s
      @logger.error("[CloudflareDNS] Failed to create A record: #{errors}")
      nil
    end
  rescue StandardError => e
    @logger.error("[CloudflareDNS] Error creating DNS record: #{e.message}")
    nil
  end

  # Delete all DNS records for hostname.proxysock.com
  def delete_vm_dns(hostname)
    return unless enabled?

    full_name = "#{hostname}.#{@base_domain}"
    @logger.info("[CloudflareDNS] Deleting DNS records for #{full_name}")

    record_ids = find_records_by_name(full_name)
    record_ids.each do |id|
      cf_delete("/zones/#{@zone_id}/dns_records/#{id}")
      @logger.info("[CloudflareDNS] Deleted record #{id}")
    end

    true
  rescue StandardError => e
    @logger.error("[CloudflareDNS] Error deleting DNS records: #{e.message}")
    false
  end

  def enabled?
    @api_token.present? && @zone_id.present? && @base_domain.present? &&
      @api_token != 'your_token_here' && @zone_id != 'your_zone_id_here'
  end

  private

  def find_records_by_name(full_name)
    response = cf_get("/zones/#{@zone_id}/dns_records?name=#{full_name}")

    if response['success']
      response['result'].map { |r| r['id'] }
    else
      []
    end
  end

  def cf_headers
    {
      'Authorization' => "Bearer #{@api_token}",
      'Content-Type' => 'application/json'
    }
  end

  def cf_get(path)
    uri = URI("#{BASE_URL}#{path}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.open_timeout = 10
    http.read_timeout = 10

    request = Net::HTTP::Get.new(uri)
    cf_headers.each { |k, v| request[k] = v }

    response = http.request(request)
    JSON.parse(response.body)
  end

  def cf_post(path, body)
    uri = URI("#{BASE_URL}#{path}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.open_timeout = 10
    http.read_timeout = 10

    request = Net::HTTP::Post.new(uri)
    cf_headers.each { |k, v| request[k] = v }
    request.body = body.to_json

    response = http.request(request)
    JSON.parse(response.body)
  end

  def cf_delete(path)
    uri = URI("#{BASE_URL}#{path}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.open_timeout = 10
    http.read_timeout = 10

    request = Net::HTTP::Delete.new(uri)
    cf_headers.each { |k, v| request[k] = v }

    response = http.request(request)
    JSON.parse(response.body)
  end
end

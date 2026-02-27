# frozen_string_literal: true

require 'net/http'
require 'json'
require 'base64'

class XProxyService
  BASE_URL = ENV.fetch('XPROXY_HOST', 'http://192.168.1.100')
  USERNAME = ENV.fetch('XPROXY_USERNAME', 'admin')
  PASSWORD = ENV.fetch('XPROXY_PASSWORD', 'admin')

  def initialize(logger = Rails.logger)
    @logger = logger
  end

  # Sync all proxies from XProxy to DB
  # NOTE: In-house proxy credential changes are not yet automated. Manual execution required.
  def sync_proxies
    @logger.info('[XProxyService] Starting sync...')

    response = request(:get, '/api/v1/info_list')
    proxies = response['data'] || []

    proxies.each do |proxy_data|
      process_proxy(proxy_data)
    end

    @logger.info("[XProxyService] Sync completed. Processed #{proxies.size} proxies.")
  end

  # Provision a proxy for an order
  def provision(order)
    @logger.info("[XProxyService] Provisioning for Order ##{order.id}")

    # Logic to find an available proxy
    # For now, we find one locally that was synced and marked as available
    proxy = MobileProxy.where(proxy_source: 'xproxy', status: 'available').first

    raise 'No available XProxy instances found!' unless proxy

    # Generate credentials
    username = "user_#{SecureRandom.hex(4)}"
    password = SecureRandom.hex(8)

    # In XProxy logic from Deno, it seems we might NOT need to call an API to create a user if we just use the proxy auth?
    # The Deno script assigns it in Supabase.
    # Real XProxy usually requires an API call to add a user or Rotate.
    # Assuming for now we just assign the local record and return creds.

    proxy.update!(
      status: 'assigned',
      username: username,
      password: password,
      mobile_proxy_order_id: order.id
    )

    assignment_details = {
      ip_address: proxy.ip_address,
      port: proxy.port,
      username: username,
      password: password,
      proxy_source: 'xproxy'
    }

    # Send email
    begin
      ProxyMailer.credentials_email(order, assignment_details).deliver_later
    rescue StandardError => e
      @logger.error("[XProxyService] Failed to queue email: #{e.message}")
    end

    assignment_details
  end

  private

  def process_proxy(data)
    # Mapping XProxy data to our MobileProxy model
    # Data fields based on Deno script analysis

    proxy_port = data['proxy_port']
    return unless proxy_port # Skip if no port

    # Construct unique identifier (e.g., host:port or device_imei)
    # Using public_ip:proxy_port as fallback uniqueness
    ip = data['public_ip'] || '0.0.0.0'
    unique_id = "#{ip}:#{proxy_port}"

    proxy = MobileProxy.find_or_initialize_by(xproxy_order_id: unique_id) # Using xproxy_order_id as generic unique ID holder

    proxy.assign_attributes(
      ip_address: ip,
      port: proxy_port,
      proxy_source: 'xproxy',
      status: proxy.new_record? ? 'available' : proxy.status,
      metadata: {
        device_name: data['device_name'],
        device_model: data['device_model'],
        isp: data['device_extra_info']&.fetch('provider', 'unknown'),
        signal: data['signal_strength'],
        battery: data['battery_level']
      }
    )

    proxy.save!
  end

  def request(method, endpoint, body = nil)
    uri = URI("#{BASE_URL}#{endpoint}")
    http = Net::HTTP.new(uri.host, uri.port)

    request = case method
              when :get then Net::HTTP::Get.new(uri)
              when :post then Net::HTTP::Post.new(uri)
              end

    request.basic_auth(USERNAME, PASSWORD)
    request['Content-Type'] = 'application/json'
    request.body = body.to_json if body

    response = http.request(request)

    unless response.is_a?(Net::HTTPSuccess)
      @logger.error("[XProxyService] Request failed: #{response.code} #{response.body}")
      raise "XProxy API Error: #{response.code}"
    end

    JSON.parse(response.body)
  rescue StandardError => e
    @logger.error("[XProxyService] Connection error: #{e.message}")
    raise e
  end
end

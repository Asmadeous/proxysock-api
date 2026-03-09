# frozen_string_literal: true

require 'net/http'
require 'json'
require 'base64'

class XProxyService
  BASE_URL = ENV.fetch('XPROXY_HOST', 'http://74.208.234.109')
  USERNAME = ENV.fetch('XPROXY_USERNAME', 'admin')
  PASSWORD = ENV.fetch('XPROXY_PASSWORD', '')

  def initialize(logger = Rails.logger)
    @logger = logger
  end

  # Sync all proxies from XProxy to ProxyInstance
  def sync_proxies
    @logger.info('[XProxyService] Starting proxy sync...')
    begin
      data = request(:get, '/api/v1/info_list')
      unless data && data['data'].is_a?(Array)
        log_system_event('sync_invalid_response', 'error', 'Invalid response from XProxy API during sync', { response: data })
        return
      end

      proxies = data['data']
      sync_stats = { fetched: proxies.length, updated: 0, created: 0, errors: 0 }

      proxies.each do |proxy_data|
        process_proxy(proxy_data, sync_stats)
      rescue StandardError => e
        @logger.error("[XProxyService] Error processing proxy: #{e.message}")
        sync_stats[:errors] += 1
      end

      log_system_event('sync_completed', 'info', "Proxy sync completed: #{sync_stats[:created]} created, #{sync_stats[:updated]} updated", { stats: sync_stats })
      sync_stats
    rescue StandardError => e
      log_system_event('sync_failed', 'error', "Proxy sync failed: #{e.message}", { error: e.message })
      raise e
    end
  end

  # Provision a proxy for an order
  def provision(order)
    @logger.info("[XProxyService] Provisioning for Order ##{order.id}")
    
    # Requirement: "XProxy Mobile Canadian Proxies"
    # Find ISP mapping from metadata (Bell: 4, Rogers: 5, Telus: 6)
    target_isp_id = order.metadata&.dig('isp_id')
    
    proxy_instance = ProxyInstance.available
                                 .where("metadata->>'isp_id' = ?", target_isp_id.to_s)
                                 .first

    proxy_instance ||= ProxyInstance.available.first unless target_isp_id

    unless proxy_instance
      handle_provisioning_failure(order, target_isp_id)
      raise "No available proxies matching criteria (ISP: #{target_isp_id || 'ANY'})"
    end

    # Generate credentials
    username = "user_#{SecureRandom.hex(4)}"
    password = SecureRandom.hex(8)

    # Billing Logic
    is_usage_based = order.product_pricing&.duration_type == 'usage_gb'
    gb_limit = is_usage_based ? (order.quantity || 1) : nil
    
    expiry_date = calculate_expiry(order)

    # Create Assignment
    assignment = ProxyAssignment.create!(
      order: order,
      user: (order.orderable if order.orderable_type == 'User'),
      proxy_instance: proxy_instance,
      username: username,
      password: password,
      status: 'active',
      expires_at: expiry_date,
      gb_limit: gb_limit,
      gb_used: 0,
      is_owned_proxy: true
    )

    proxy_instance.update!(status: 'assigned')

    # Update Order credentials
    conn_string = "#{username}:#{password}@#{proxy_instance.proxy_address}"
    order.credentials ||= []
    order.credentials << {
      http: "http://#{conn_string}",
      socks5: "socks5://#{conn_string}",
      gb_limit: gb_limit,
      gb_used: 0,
      assignment_id: assignment.id,
      proxy_address: proxy_instance.proxy_address
    }
    order.save!

    send_credentials_email(order, assignment, proxy_instance)

    @logger.info("[XProxyService] Provisioned assignment #{assignment.id}")
    assignment
  end

  def cleanup_expired
    @logger.info('[XProxyService] Running cleanup of expired assignments...')
    ProxyAssignment.active.find_each do |assignment|
      if assignment.expired?
        @logger.info("[XProxyService] Disconnecting expired assignment #{assignment.id}")
        assignment.disconnect!
        # Potential XProxy API call to remote credentials here
      end
    end
  end

  private

  def calculate_expiry(order)
    case order.product_pricing&.duration_type
    when 'usage_gb' then 1.year.from_now
    when 'daily'    then (order.quantity || 1).days.from_now
    when 'weekly'   then (order.quantity || 1).weeks.from_now
    when 'monthly'  then (order.quantity || 1).months.from_now
    else 30.days.from_now
    end
  end

  def process_proxy(data, stats)
    proxy_port = data['proxy_port']
    return unless proxy_port

    proxy_address = "74.208.234.109:#{proxy_port}" 
    device_info = data['device_extra_info'] || {}
    provider_name = device_info['provider'] || 'unknown'
    
    provider_to_isp_id = {
      'Bell' => '4', 'BELL' => '4',
      'Rogers' => '5', 'ROGERS' => '5',
      'Telus' => '6', 'TELUS' => '6'
    }
    isp_id = provider_to_isp_id[provider_name] || device_info['provider_id'] || '0'

    metadata = {
      protocols: ['http', 'socks5'],
      isp: provider_name.toLowerCase(),
      isp_id: isp_id,
      device_type: data['device_manufacture'] || 'residential',
      http_port: data['proxy_port'],
      socks5_port: data['socks5_port'] || data['proxy_port'],
      public_ip: data['public_ip'],
      last_rotation: data['last_rotation'],
      device_imei: data['device_imei'],
      sync_source: 'xproxy_api'
    }

    instance = ProxyInstance.find_or_initialize_by(proxy_address: proxy_address)
    stats[instance.new_record? ? :created : :updated] += 1

    instance.assign_attributes(
      device_type: metadata[:device_type],
      status: instance.new_record? ? 'available' : instance.status,
      metadata: metadata,
      last_health_check: Time.current
    )
    instance.save!
  end

  def handle_provisioning_failure(order, isp_id)
    log_system_event('no_available_proxies', 'error', "No available proxies found for order #{order.id}", {
      order_id: order.id, isp_id: isp_id
    })
    
    # Notify support via email logic from Supabase snippet
    # AdminMailer.proxy_provisioning_failure(order, isp_id).deliver_later rescue nil
  end

  def send_credentials_email(order, assignment, proxy_instance)
    return unless order.orderable.is_a?(User)

    ProxyMailer.with(
      owner: order.orderable,
      proxy: proxy_instance,
      order: order,
      assignment: assignment
    ).credentials_email.deliver_later
  rescue StandardError => e
    @logger.error("[XProxyService] Email failed: #{e.message}")
  end

  def log_system_event(action, level, message, metadata = {})
    @logger.send(level, "[XProxyService][#{action}] #{message} | #{metadata.to_json}")
    # If a SystemLog model existed, we would insert here.
  end

  def request(method, endpoint, body = nil)
    uri = URI("#{BASE_URL}#{endpoint}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == 'https'

    req = case method
          when :get then Net::HTTP::Get.new(uri)
          when :post then Net::HTTP::Post.new(uri)
          end

    req.basic_auth(USERNAME, PASSWORD)
    req['Content-Type'] = 'application/json'
    req.body = body.to_json if body

    response = http.request(req)
    raise "XProxy Error #{response.code}: #{response.body}" unless response.is_a?(Net::HTTPSuccess)

    JSON.parse(response.body)
  end
end

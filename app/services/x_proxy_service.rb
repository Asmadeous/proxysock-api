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
      sync_stats = { fetched: 0, updated: 0, created: 0, errors: 0 }
      page = 1
      limit = 50

      loop do
        data = request(:get, "/api/v1/info_list?page=#{page}&limit=#{limit}")
        unless data && data['data'].is_a?(Array)
          log_system_event('sync_invalid_response', 'error', 'Invalid response from XProxy API during sync', { response: data })
          break
        end

        proxies = data['data']
        break if proxies.empty?

        sync_stats[:fetched] += proxies.length

        proxies.each do |proxy_data|
          process_proxy(proxy_data, sync_stats)
        rescue StandardError => e
          @logger.error("[XProxyService] Error processing proxy: #{e.message}")
          sync_stats[:errors] += 1
        end

        total = data['total'].to_i
        break if sync_stats[:fetched] >= total

        page += 1
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
    duration = order.metadata&.dig('period').to_i
    duration = 1 if duration <= 0
    gb_limit = is_usage_based ? duration : nil

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
    disconnected = 0

    ProxyAssignment.active.find_each do |assignment|
      next unless assignment.expired?

      reason = assignment.expiry_reason
      @logger.info("[XProxyService] Disconnecting assignment #{assignment.id} (#{reason})")

      assignment.disconnect!(reason: reason)
      invalidate_proxy_sessions(assignment.proxy_instance.proxy_address)
      disconnected += 1
    rescue StandardError => e
      @logger.error("[XProxyService] Failed to disconnect assignment #{assignment.id}: #{e.message}")
    end

    @logger.info("[XProxyService] Cleanup complete: #{disconnected} assignment(s) disconnected.")
  end

  # Call this from a controller or webhook whenever the user consumes data.
  # gb_amount should be a Float (e.g. 0.5 for 500 MB).
  # Returns true if the limit was just crossed — callers may want to surface
  # a warning to the user immediately in that case.
  def record_gb_usage!(assignment_id, gb_amount)
    assignment = ProxyAssignment.active.find(assignment_id)
    just_depleted = assignment.record_usage!(gb_amount)

    if just_depleted
      @logger.info("[XProxyService] GB limit reached for assignment #{assignment.id} — disconnecting")
      assignment.disconnect!(reason: :gb_depleted)
      invalidate_proxy_sessions(assignment.proxy_instance.proxy_address)
    end

    just_depleted
  rescue ActiveRecord::RecordNotFound
    @logger.warn("[XProxyService] record_gb_usage!: assignment #{assignment_id} not found or not active")
    false
  end

  # Rotate IP for a proxy (format: "ip:port")
  # GET /api/v1/rotate_ip/proxy/:proxy
  def rotate_ip(proxy_address)
    @logger.info("[XProxyService] Rotating IP for #{proxy_address}")
    result = request(:get, "/api/v1/rotate_ip/proxy/#{proxy_address}")
    log_system_event('rotate_ip', result['status'] ? 'info' : 'error', result['msg'], { proxy: proxy_address })
    result
  end

  # Reboot the dongle at a given proxy address (format: "ip:port")
  # GET /api/v1/reboot/proxy/:proxy
  def reboot_dongle(proxy_address)
    @logger.info("[XProxyService] Rebooting dongle at #{proxy_address}")
    result = request(:get, "/api/v1/reboot/proxy/#{proxy_address}")
    log_system_event('reboot_dongle', result['status'] ? 'info' : 'error', result['msg'], { proxy: proxy_address })
    result
  end

  private

  # Reboot the dongle to invalidate any live sessions after disconnect.
  # Errors are swallowed so that one failed reboot doesn't block the rest
  # of the cleanup loop.
  def invalidate_proxy_sessions(proxy_address)
    reboot_dongle(proxy_address)
    @logger.info("[XProxyService] Invalidated sessions on #{proxy_address}")
  rescue StandardError => e
    @logger.error("[XProxyService] Failed to invalidate sessions on #{proxy_address}: #{e.message}")
  end

  def calculate_expiry(order)
    # The frontend maps the desired "duration" or "GB" into the metadata['period'] block
    duration = order.metadata&.dig('period').to_i
    duration = 1 if duration <= 0

    case order.product_pricing&.duration_type
    when 'usage_gb' then 1.year.from_now
    when 'daily'    then duration.days.from_now
    when 'weekly'   then duration.weeks.from_now
    when 'monthly'  then duration.months.from_now
    else 30.days.from_now
    end
  end

  def process_proxy(data, stats)
    proxy_port = data['proxy_port']
    return unless proxy_port

    # Use the host returned by the API rather than a hardcoded IP
    host = data['host'].presence || BASE_URL.gsub(%r{^https?://}, '')
    proxy_address = "#{host}:#{proxy_port}"

    device_info = data['device_extra_info'] || {}
    provider_name = device_info['provider'] || 'unknown'

    provider_to_isp_id = {
      'Bell' => '4', 'BELL' => '4',
      'Rogers' => '5', 'ROGERS' => '5',
      'Telus' => '6', 'TELUS' => '6'
    }
    isp_id = provider_to_isp_id[provider_name] || device_info['provider_id'] || '0'

    metadata = {
      protocols: %w[http socks5],
      isp: provider_name.downcase,
      isp_id: isp_id,
      device_type: data['device_manufacture'] || 'residential',
      http_port: data['proxy_port'],
      socks5_port: data['socks5_port'] || data['proxy_port'],
      public_ip: data['public_ip'],
      last_rotation: data['last_rotation'],
      device_imei: data['device_imei'],
      signal_strength: device_info['signal_strength'],
      network_mode: device_info['network_mode'],
      sim_live: device_info['sim_live'],
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
    target_email = order.metadata&.dig('credentials_email').presence
    owner = order.orderable

    ProxyMailer.with(
      owner: owner,
      proxy: proxy_instance,
      order: order,
      assignment: assignment,
      target_email: target_email
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
          when :get    then Net::HTTP::Get.new(uri)
          when :post   then Net::HTTP::Post.new(uri)
          when :put    then Net::HTTP::Put.new(uri)
          when :delete then Net::HTTP::Delete.new(uri)
          else raise ArgumentError, "Unsupported HTTP method: #{method}"
          end

    req.basic_auth(USERNAME, PASSWORD)
    req['Content-Type'] = 'application/json'
    req.body = body.to_json if body

    response = http.request(req)
    raise "XProxy Error #{response.code}: #{response.body}" unless response.is_a?(Net::HTTPSuccess)

    JSON.parse(response.body)
  end
end

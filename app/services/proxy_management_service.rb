# frozen_string_literal: true

class ProxyManagementService
  def initialize(order)
    @order = order
    @client = MyProxyApiClient.new
  end

  # Connection details from what MyProxyAPI returned for the order, in any of the shapes it
  # uses: the order view ({ order:, ips: ["ip:port:user:pass"], ips_info: ["ip - US, New York,
  # NY"], config: { auth_user_pass:, proxy_format:, auth_whitelistip: } }), a residential
  # rotating order ({ order_info: { username, password, traffic_* in GB } } with generated
  # "host:port:user:pass" strings in proxy_credentials), or a bare placement ({ data: }).
  # A protocol the customer changed here wins over the stored one.
  def self.connection_details(order)
    metadata = order.metadata || {}
    api_res = metadata['my_proxy_api_response']
    return nil if api_res.blank?

    records = api_res.is_a?(Array) ? api_res : [api_res]
    first_rec = records.first || {}
    auth = [first_rec.dig('config', 'auth_user_pass'), first_rec['order_info'], first_rec['data']].find { |h| h.is_a?(Hash) } || {}
    endpoints = records.flat_map { |rec| rec['ips'] || [rec['ip']].compact }
    endpoints = generated_endpoints(metadata) if endpoints.empty?
    host, port = endpoints.first.to_s.split(':')
    locations = records.flat_map { |rec| rec['ips_info'] || [] }.filter_map { |line| location_from(line) }
    locations = [metadata['locationsString']] if locations.empty? && metadata['locationsString'].present?
    traffic = first_rec['order_info'] || {}

    {
      endpoints: endpoints.uniq,
      ip: first_rec['ip'] || host,
      port: first_rec['port'] || first_rec['http_port'] || first_rec['socks5_port'] || port,
      username: auth['username'] || first_rec['username'],
      password: auth['password'] || first_rec['password'],
      protocol: metadata['protocol'].presence || first_rec.dig('config', 'proxy_format').presence || 'http',
      locations: locations.uniq,
      whitelist_ips: Array(first_rec.dig('config', 'auth_whitelistip')).filter_map { |w| w['ip_address'] if w.is_a?(Hash) },
      traffic_used_gb: traffic['traffic_used'],
      traffic_limit_gb: traffic['traffic_limit']
    }
  end

  # VPN orders store { order: { end_time, timezone }, config: { auth_credentials: {} },
  # vpn_info: [{ vpn_name, vpn_type, ip_info: " - US, North Carolina, NC" }] }. There is no
  # server IP: customers connect with the downloaded .ovpn file.
  PROVIDER_TIME_ZONES = { 'EEST' => 'Europe/Bucharest', 'EET' => 'Europe/Bucharest' }.freeze

  def self.vpn_details(order)
    api_res = order.metadata&.dig('my_proxy_api_response')
    return nil unless api_res.is_a?(Hash)

    auth = api_res.dig('config', 'auth_credentials') || api_res.dig('config', 'auth_user_pass') || {}
    servers = Array(api_res['vpn_info']).select { |v| v.is_a?(Hash) }
    {
      username: auth['username'] || api_res['username'],
      password: auth['password'] || api_res['password'],
      server: servers.first&.dig('vpn_name') || api_res['server'],
      protocol: servers.first&.dig('vpn_type'),
      endpoints: servers.map { |v| [v['vpn_name'], v['vpn_type'], location_from(v['ip_info'])].compact_blank.join(' · ') },
      locations: servers.filter_map { |v| location_from(v['ip_info']) },
      expires_at: provider_time(api_res.dig('order', 'end_time'), api_res.dig('order', 'timezone'))
    }
  end

  # When the provider's term ends: the stored order's end_time, read in its timezone.
  def self.provider_expires_at(order)
    api_res = order.metadata&.dig('my_proxy_api_response')
    record = api_res.is_a?(Array) ? api_res.first : api_res
    return nil unless record.is_a?(Hash)

    provider_time(record.dig('order', 'end_time'), record.dig('order', 'timezone'))
  end

  # "74.91.49.93 - US, New York, NY" or " - US, North Carolina, NC" -> "US, ..."
  def self.location_from(ip_info)
    ip_info.to_s.split(' - ', 2).last.to_s.strip.presence
  end

  def self.provider_time(value, zone)
    return nil if value.blank?

    ActiveSupport::TimeZone[PROVIDER_TIME_ZONES.fetch(zone.to_s, 'UTC')].parse(value.to_s)
  rescue ArgumentError
    nil
  end

  def self.generated_endpoints(metadata)
    Array(metadata['proxy_credentials']).flat_map { |creds| Array(creds.is_a?(Hash) ? creds['data'] : creds) }
                                        .select { |line| line.is_a?(String) && line.include?(':') }
  end
  private_class_method :generated_endpoints, :location_from, :provider_time

  def credentials
    return nil unless @order.product.provider_type == 'myproxyapi'

    details = self.class.connection_details(@order)
    return nil unless details

    {
      type: 'proxy',
      ip: details[:ip],
      port: details[:port],
      username: details[:username],
      password: details[:password],
      protocol: details[:protocol],
      provider_order_id: extract_provider_order_id
    }
  end

  def update_credentials(username, password)
    verify_support!

    provider_order_id = extract_provider_order_id
    raise 'Provider order ID not found' unless provider_order_id.present?

    # VPN orders use a different credential change endpoint
    if @order.product.product_type == 'vpn'
      response = @client.update_vpn_credentials(provider_order_id, username, password)
      full_details = @client.view_vpn_order(provider_order_id)
    else
      response = @client.update_credentials(provider_order_id, username, password)
      full_details = @client.view_order(provider_order_id)
    end

    @order.metadata['my_proxy_api_response'] = full_details['data'].is_a?(Array) ? full_details['data'].first : full_details['data']
    @order.save!

    { message: 'Credentials updated successfully', response: response }
  end

  def change_protocol(protocol)
    verify_support!

    provider_order_id = extract_provider_order_id
    raise 'Provider order ID not found' unless provider_order_id.present?

    response = @client.change_protocol(provider_order_id, protocol)

    @order.metadata['protocol'] = protocol
    @order.save!

    { message: 'Protocol updated successfully', response: response }
  end

  def rotate_ip
    verify_support!

    provider_order_id = extract_provider_order_id
    raise 'Provider order ID not found' unless provider_order_id.present?

    response = @client.rotate_ip(provider_order_id)

    # Refresh details after rotation
    full_details = @client.view_order(provider_order_id)
    @order.metadata['my_proxy_api_response'] = full_details['data'].is_a?(Array) ? full_details['data'].first : full_details['data']
    @order.save!

    { message: 'IP replacement triggered', response: response }
  end

  def whitelist_add(ip, description = nil)
    verify_support!

    provider_order_id = extract_provider_order_id
    raise 'Provider order ID not found' unless provider_order_id.present?

    # Mobile orders use a different whitelist endpoint
    response = if @order.product.product_category&.slug == 'mobile'
                 @client.mobile_update_whitelisted_ip(provider_order_id, ip)
               else
                 @client.whitelist_add(provider_order_id, ip, description)
               end
    refresh_order_details(provider_order_id)

    { message: 'IP added to whitelist', response: response }
  end

  def whitelist_delete(ip)
    verify_support!

    provider_order_id = extract_provider_order_id
    raise 'Provider order ID not found' unless provider_order_id.present?

    response = @client.whitelist_delete(provider_order_id, ip)
    refresh_order_details(provider_order_id)

    { message: 'IP removed from whitelist', response: response }
  end

  # Re-reads the order from MyProxyAPI and stores it; true when fresh details were saved.
  def refresh_details!
    provider_order_id = extract_provider_order_id
    return false if provider_order_id.blank?

    data = if @order.product.product_type == 'vpn'
             @client.view_vpn_order(provider_order_id)
           else
             case @order.product.product_category&.slug
             when 'mobile' then @client.view_mobile_order(provider_order_id)
             when 'global-isp' then @client.view_global_isp_order(provider_order_id)
             else @client.view_order(provider_order_id)
             end
           end&.dig('data')
    data = data.first if data.is_a?(Array)
    return false if data.blank?

    @order.metadata['my_proxy_api_response'] = data
    @order.save!
    true
  end

  private

  # Keeps the stored order view (and so the whitelist shown to the customer) current. The
  # change itself has already succeeded, so a failed refresh is only logged.
  def refresh_order_details(_provider_order_id)
    refresh_details!
  rescue StandardError => e
    Rails.logger.warn("[ProxyManagementService] Could not refresh order #{@order.id} after whitelist change: #{e.message}")
  end

  def verify_support!
    raise 'Action not supported for this product' unless @order.product.provider_type == 'myproxyapi'
  end

  def extract_provider_order_id
    @order.metadata&.dig('provider_order_id') ||
      @order.metadata&.dig('my_proxy_api_response', 'order', 'order_id') ||
      @order.metadata&.dig('my_proxy_api_response', 'order_id') ||
      @order.metadata&.dig('my_proxy_api_response', 'data', 'order_id')
  end
end

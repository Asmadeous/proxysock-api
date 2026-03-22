# frozen_string_literal: true

class ProxyManagementService
  def initialize(order)
    @order = order
    @client = MyProxyApiClient.new
  end

  def credentials
    return nil unless @order.product.provider_type == 'myproxyapi'

    api_res = @order.metadata['my_proxy_api_response']
    return nil unless api_res.present?

    # Handle both single record and multiple records (array)
    records = api_res.is_a?(Array) ? api_res : [api_res]
    first_rec = records.first || {}

    # Extract from nested view-order structure if present
    # { order: {}, ips: [...], config: { auth_user_pass: {} } }
    auth = first_rec.dig('config', 'auth_user_pass') || {}

    {
      type: 'proxy',
      ip: first_rec['ip'],
      port: first_rec['port'] || first_rec['http_port'] || first_rec['socks5_port'],
      username: auth['username'] || first_rec['username'],
      password: auth['password'] || first_rec['password'],
      protocol: @order.metadata['protocol'] || 'http',
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

    { message: 'IP added to whitelist', response: response }
  end

  def whitelist_delete(ip)
    verify_support!

    provider_order_id = extract_provider_order_id
    raise 'Provider order ID not found' unless provider_order_id.present?

    response = @client.whitelist_delete(provider_order_id, ip)

    { message: 'IP removed from whitelist', response: response }
  end

  private

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

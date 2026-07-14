# frozen_string_literal: true

class LocaltonetApiClient
  BASE_URL = 'https://localtonet.com/api/v2'
  API_KEY  = ENV.fetch('LOCALTONET_API_KEY', '')

  class ApiError < StandardError; end

  # ──────────────────────── Tunnel Retrieval ────────────────────────

  # GET /api/v2/tunnels — list all tunnels across all auth tokens
  def list_tunnels
    get('/tunnels')
  end

  # GET /api/v2/tunnels/:id — full details of a specific tunnel
  def get_tunnel(tunnel_id)
    get("/tunnels/#{tunnel_id}")
  end

  # GET /api/v2/auth-tokens/:token/tunnels — tunnels under a specific device token
  def tunnels_by_token(auth_token)
    get("/auth-tokens/#{auth_token}/tunnels")
  end

  # ──────────────────────── Tunnel Creation ─────────────────────────

  # POST /api/v2/tunnels/proxy — create a standard proxy tunnel (HTTP or SOCKS5)
  # protocol_type: 6 = HTTP, 7 = SOCKS5
  def create_proxy_tunnel(auth_token:, protocol_type: 6, server_code: nil, local_server_ip: nil, ip_restrictions: [])
    body = { authToken: auth_token, protocolType: protocol_type }
    body[:serverCode] = server_code if server_code
    body[:localServerIp] = local_server_ip if local_server_ip
    body[:ipRestrictions] = ip_restrictions if ip_restrictions.any?
    post('/tunnels/proxy', body)
  end

  # POST /api/v2/tunnels/shared-proxy — create shared/rotating proxy tunnel
  def create_shared_proxy_tunnel(server_code: nil, protocol_type: 0, auth_token_group_ids: [])
    body = { protocolType: protocol_type }
    body[:serverCode] = server_code if server_code
    body[:authTokenGroupIds] = auth_token_group_ids if auth_token_group_ids.any?
    post('/tunnels/shared-proxy', body)
  end

  # ──────────────────────── Tunnel Actions ──────────────────────────

  def start_tunnel(tunnel_id)
    post("/tunnels/#{tunnel_id}/actions/start", {})
  end

  def stop_tunnel(tunnel_id)
    post("/tunnels/#{tunnel_id}/actions/stop", {})
  end

  def delete_tunnel(tunnel_id)
    delete("/tunnels/#{tunnel_id}")
  end

  # ──────────────────────── Shared Proxy Clients ───────────────────

  # GET /api/v2/tunnels/:id/shared-proxy-clients
  def list_clients(tunnel_id)
    get("/tunnels/#{tunnel_id}/shared-proxy-clients")
  end

  # POST /api/v2/tunnels/:id/shared-proxy-clients
  # bandwidth_limit is in bytes (e.g. 1 GB = 1073741824)
  def add_client(tunnel_id, username:, password:, bandwidth_limit_bytes: nil, expiration_date: nil, thread_limit: nil, description: nil)
    body = { username: username, password: password }
    body[:description] = description if description

    if bandwidth_limit_bytes
      body[:enableBandwidthLimit] = true
      body[:bandwidthLimit] = bandwidth_limit_bytes
    else
      body[:enableBandwidthLimit] = false
      body[:bandwidthLimit] = 0
    end

    if expiration_date
      body[:enableExpirationDate] = true
      body[:expirationDate] = expiration_date.iso8601
    else
      body[:enableExpirationDate] = false
    end

    if thread_limit
      body[:enableThreadLimit] = true
      body[:threadLimit] = thread_limit
    else
      body[:enableThreadLimit] = false
      body[:threadLimit] = 0
    end

    post("/tunnels/#{tunnel_id}/shared-proxy-clients", body)
  end

  # PATCH /api/v2/tunnels/:id/shared-proxy-clients/:client_id
  def update_client(tunnel_id, client_id, username: nil, password: nil, bandwidth_limit_bytes: nil, expiration_date: nil, thread_limit: nil, description: nil)
    body = {}
    body[:username] = username if username
    body[:password] = password if password
    body[:description] = description if description

    unless bandwidth_limit_bytes.nil?
      body[:enableBandwidthLimit] = bandwidth_limit_bytes.positive?
      body[:bandwidthLimit] = bandwidth_limit_bytes
    end

    unless expiration_date.nil?
      body[:enableExpirationDate] = true
      body[:expirationDate] = expiration_date.iso8601
    end

    unless thread_limit.nil?
      body[:enableThreadLimit] = thread_limit.positive?
      body[:threadLimit] = thread_limit
    end

    patch("/tunnels/#{tunnel_id}/shared-proxy-clients/#{client_id}", body)
  end

  # DELETE /api/v2/tunnels/:id/shared-proxy-clients/:client_id
  def delete_client(tunnel_id, client_id)
    delete("/tunnels/#{tunnel_id}/shared-proxy-clients/#{client_id}")
  end

  # ──────────────────────── Mobile IP Rotation ─────────────────────

  # GET /api/v2/auth-tokens/:token/airplane-mode-settings
  def get_airplane_settings(auth_token)
    get("/auth-tokens/#{auth_token}/airplane-mode-settings")
  end

  # PATCH /api/v2/auth-tokens/:token/airplane-mode-settings
  # time = interval in seconds between toggles, delay = seconds to wait after toggle
  def set_airplane_mode(auth_token, enabled:, time: nil, delay: nil)
    body = { isEnabled: enabled }
    body[:time] = time if time
    body[:delay] = delay if delay
    patch("/auth-tokens/#{auth_token}/airplane-mode-settings", body)
  end

  # GET /api/v2/auth-tokens/:token/ip-history
  def get_ip_history(auth_token, summary: false)
    path = "/auth-tokens/#{auth_token}/ip-history"
    path += '?view=summary' if summary
    get(path)
  end

  # ──────────────────────── Bandwidth Management ───────────────────

  def get_bandwidth_usage(tunnel_id)
    get("/tunnels/#{tunnel_id}/bandwidth-usage")
  end

  def reset_bandwidth(tunnel_id)
    post("/tunnels/#{tunnel_id}/bandwidth-usage/reset", {})
  end

  def get_bandwidth_limit(tunnel_id)
    get("/tunnels/#{tunnel_id}/bandwidth-limit")
  end

  def set_bandwidth_limit(tunnel_id, limit_bytes:)
    patch("/tunnels/#{tunnel_id}/bandwidth-limit", { bandwidthLimit: limit_bytes })
  end

  # ──────────────────────── Authentication Settings ────────────────

  def get_authentication(tunnel_id)
    get("/tunnels/#{tunnel_id}/authentication")
  end

  def set_authentication(tunnel_id, enabled:, username: nil, password: nil)
    body = { isActive: enabled }
    body[:userName] = username if username
    body[:password] = password if password
    patch("/tunnels/#{tunnel_id}/authentication", body)
  end

  # ──────────────────────── Token Management ───────────────────────

  def list_auth_tokens
    get('/auth-tokens')
  end

  def get_auth_token(token)
    get("/auth-tokens/#{token}")
  end

  # ──────────────────────── Servers ─────────────────────────────────

  def list_servers
    get('/servers')
  end

  # LocalToNet reshuffles its server fleet over time (us10 no longer exists),
  # so resolve a live US server code from /servers instead of hardcoding one.
  def us_server_code
    server = list_servers.find { |s| s['serverCode'].to_s.start_with?('us') }
    raise ApiError, 'LocalToNet has no US server available' if server.nil?

    server['serverCode']
  end

  private

  def get(path)
    request(:get, path)
  end

  def post(path, body)
    request(:post, path, body)
  end

  def patch(path, body)
    request(:patch, path, body)
  end

  def delete(path)
    request(:delete, path)
  end

  def request(method, path, body = nil)
    uri = URI("#{BASE_URL}#{path}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.open_timeout = 15
    http.read_timeout = 30

    req = case method
          when :get    then Net::HTTP::Get.new(uri)
          when :post   then Net::HTTP::Post.new(uri)
          when :patch  then Net::HTTP::Patch.new(uri)
          when :delete then Net::HTTP::Delete.new(uri)
          end

    req['Authorization'] = "Bearer #{API_KEY}"
    req['Content-Type']  = 'application/json'
    req['Accept']        = 'application/json'

    if body && %i[post patch].include?(method)
      req.body = body.to_json
    end

    response = http.request(req)

    case response.code.to_i
    when 200, 201
      response.body.present? ? JSON.parse(response.body) : {}
    when 204
      {}
    when 401
      raise ApiError, 'LocalToNet API: Unauthorized — check LOCALTONET_API_KEY'
    when 404
      raise ApiError, "LocalToNet API: Not Found — #{path}"
    else
      error_body = begin
        JSON.parse(response.body)
      rescue StandardError
        response.body
      end
      raise ApiError, "LocalToNet API error (#{response.code}): #{error_body}"
    end
  rescue Net::OpenTimeout, Net::ReadTimeout => e
    raise ApiError, "LocalToNet API timeout: #{e.message}"
  end
end

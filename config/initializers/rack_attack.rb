# frozen_string_literal: true

# Rack::Attack for rate limiting API endpoints
# Docs: https://github.com/rack/rack-attack
class Rack::Attack
  ### Throttle Spammy Clients ###

  # General API: 60 requests per minute per IP
  throttle('api/ip', limit: 60, period: 60) do |req|
    req.ip if req.path.start_with?('/api/')
  end

  # Webhooks: 30 requests per minute per IP (payment callbacks)
  throttle('webhooks/ip', limit: 30, period: 60) do |req|
    req.ip if req.path.start_with?('/webhooks/')
  end

  # Auth endpoints: 5 attempts per 20 seconds per IP (login brute-force protection)
  throttle('auth/ip', limit: 5, period: 20) do |req|
    req.ip if req.path.include?('/auth/login') && req.post?
  end

  # Admin login: 5 attempts per minute per IP
  throttle('admin_auth/ip', limit: 5, period: 60) do |req|
    req.ip if req.path == '/admin/api/auth/login' && req.post?
  end

  # Checkout/Orders: 10 per minute per user token
  throttle('checkout/token', limit: 10, period: 60) do |req|
    if req.path.include?('/checkout') && req.post?
      req.env['HTTP_AUTHORIZATION']&.gsub('Bearer ', '')
    end
  end

  # VM operations: 5 per minute per user
  throttle('vm_ops/token', limit: 5, period: 60) do |req|
    if req.path.start_with?('/web/api/vms') && (req.post? || req.put? || req.patch?)
      req.env['HTTP_AUTHORIZATION']&.gsub('Bearer ', '')
    end
  end

  # Metrics endpoint: 10 per minute (Prometheus scraping)
  throttle('metrics/ip', limit: 10, period: 60) do |req|
    req.ip if req.path == '/metrics'
  end

  ### Blocklist Repeat Offenders ###
  # Block IP if throttled 5+ times in 5 minutes
  blocklist('fail2ban/aggressive') do |req|
    Rack::Attack::Allow2Ban.filter(req.ip, maxretry: 5, findtime: 300, bantime: 3600) do
      false # Only triggered when other throttles trigger
    end
  end

  ### Custom Responses ###
  self.throttled_responder = lambda do |request|
    match_data = request.env['rack.attack.match_data']
    now = match_data[:epoch_time]
    retry_after = match_data[:period] - (now % match_data[:period])

    [
      429,
      {
        'Content-Type' => 'application/json',
        'Retry-After' => retry_after.to_s
      },
      [{ error: 'Rate limit exceeded', retry_after: retry_after }.to_json]
    ]
  end
end

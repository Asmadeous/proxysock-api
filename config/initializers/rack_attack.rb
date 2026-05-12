# frozen_string_literal: true

# Rack::Attack for rate limiting API endpoints
# Docs: https://github.com/rack/rack-attack
module Rack
  class Attack
    ### Throttle Spammy Clients ###

    # Reseller API (V1): 60 requests per minute per IP
    throttle('api/ip', limit: 60, period: 60) do |req|
      req.ip if req.path.start_with?('/api/')
    end

    # Web Dashboard API: 100 requests per minute per IP
    throttle('web_api/ip', limit: 100, period: 60) do |req|
      req.ip if req.path.start_with?('/web/api/')
    end

    # Admin Management API: 100 requests per minute per IP
    throttle('admin_api/ip', limit: 100, period: 60) do |req|
      req.ip if req.path.start_with?('/admin/api/')
    end

    # Webhooks: 30 requests per minute per IP (payment callbacks)
    throttle('webhooks/ip', limit: 30, period: 60) do |req|
      req.ip if req.path.start_with?('/webhooks/')
    end

    # Authenticated logins (Brute-force protection)
    # 5 attempts per 5 minutes per IP
    throttle('login/ip/hardened', limit: 5, period: 300) do |req|
      if req.post? && (req.path.include?('/auth/login') || req.path == '/admin/api/auth/login')
        req.ip
      end
    end

    # Checkout/Orders: 10 per minute per IP/Token
    throttle('checkout/action', limit: 10, period: 60) do |req|
      if (req.path.include?('/checkout') || req.path.include?('/checkout_cart')) && req.post?
        req.env['HTTP_AUTHORIZATION']&.gsub('Bearer ', '') || req.ip
      end
    end

    # Resource Heavy Endpoints: 10 per minute per IP
    # Prevents scraping of documents or intensive tools
    throttle('heavy_resources/ip', limit: 10, period: 60) do |req|
      if req.path.end_with?('/download_invoice') ||
         req.path.end_with?('/download_ovpn') ||
         req.path.end_with?('/download_rdp_config') ||
         req.path.include?('/tools/ip_checker')
        req.ip
      end
    end

    # VM operations: 5 per minute per user/IP
    throttle('vm_ops/action', limit: 5, period: 60) do |req|
      if req.path.include?('/vms/') && (req.post? || req.put? || req.patch? || req.delete?)
        req.env['HTTP_AUTHORIZATION']&.gsub('Bearer ', '') || req.ip
      end
    end

    # Metrics endpoint: 10 per minute (Prometheus scraping)
    throttle('metrics/ip', limit: 10, period: 60) do |req|
      req.ip if req.path == '/metrics'
    end

    ### Blocklist Repeat Offenders ###
    # Block IP if throttled 10+ times in 5 minutes
    blocklist('fail2ban/aggressive') do |req|
      Rack::Attack::Allow2Ban.filter(req.ip, maxretry: 10, findtime: 300, bantime: 3600) do
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
end

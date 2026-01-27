class Rack::Attack
  # Rate limits for the application

  # Allow all local traffic
  safelist('allow-localhost') do |req|
    '127.0.0.1' == req.ip || '::1' == req.ip
  end

  # Allow an external provider (e.g., Stripe webhooks) if known
  # safelist('allow-stripe-webhooks') do |req|
  #   req.ip == '...'
  # end

  # Throttle all requests by IP (60rpm)
  # Key: "req/ip:#{req.ip}"
  throttle('req/ip', limit: 60, period: 1.minute) do |req|
    req.ip unless req.path.start_with?('/assets')
  end

  # Throttle login attempts by IP (5 reqs/20s)
  # Key: "logins/ip:#{req.ip}"
  throttle('logins/ip', limit: 5, period: 20.seconds) do |req|
    if req.path == '/api/v1/auth/token' && req.post?
      req.ip
    end
  end

  throttle('web_logins/ip', limit: 5, period: 20.seconds) do |req|
    if req.path == '/web/api/auth/login' && req.post?
      req.ip
    end
  end

  # Custom response for throttled requests
  # Custom response for throttled requests
  self.throttled_responder = lambda do |request|
    # request is a Rack::Attack::Request object
    match_data = request.env['rack.attack.match_data']
    now = match_data[:epoch_time] rescue Time.now.to_i
    
    headers = {
      'Content-Type' => 'application/json',
      'Retry-After' => (match_data ? (match_data[:period] - (now % match_data[:period])).to_s : "60")
    }

    [ 429, headers, [{ error: "Throttle limit reached. Retry later." }.to_json] ]
  end
end

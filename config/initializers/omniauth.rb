# frozen_string_literal: true

# Enable GET requests for OmniAuth (POST is default in 2.0+ for security)
OmniAuth.config.allowed_request_methods = %i[get post]
# Suppress OmniAuth 2.0+ deprecation warnings for GET requests
OmniAuth.config.silence_get_warning = true

# Fix omniauth-zoho gem: The gem is hardcoded to fetch from the Zoho CRM API.
# We override it here to fetch from the standard Zoho Accounts profile endpoint for SSO.
require 'omniauth/strategies/zoho'
module OmniAuth
  module Strategies
    class Zoho < OmniAuth::Strategies::OAuth2
      def raw_info
        # Use the standard Zoho profile API endpoint instead of CRM
        @raw_info ||= access_token.get('https://accounts.zoho.com/oauth/user/info').parsed
      end

      info do
        {
          email: raw_info['Email'],
          first_name: raw_info['First_Name'],
          last_name: raw_info['Last_Name']
        }
      end
    end
  end
end

Rails.application.config.middleware.use OmniAuth::Builder do
  # User SSO
  provider :google_oauth2, ENV['GOOGLE_CLIENT_ID'], ENV['GOOGLE_CLIENT_SECRET']
  provider :twitter2, ENV['TWITTER_CLIENT_ID'], ENV['TWITTER_CLIENT_SECRET']

  # Employee SSO (Zoho)
  provider :zoho, ENV['ZOHO_CLIENT_ID'], ENV['ZOHO_CLIENT_SECRET'],
           scope: 'AaaServer.profile.READ'

  # Global error handling for OmniAuth
  OmniAuth.config.on_failure = proc do |_env|
    # For now, just using the default OmniAuth failure handling which usually redirects to /auth/failure
    # but we can customize it if needed.
    strategy = _env['omniauth.error.strategy']
    message = _env['omniauth.error.type']
    Rails.logger.error "OmniAuth Failure: #{strategy} - #{message}"

    # Redirect to the failure path defined in routes
    Rack::Response.new(['302 Redirect'], 302, 'Location' => '/auth/failure').finish
  end
end

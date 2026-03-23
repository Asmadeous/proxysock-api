# frozen_string_literal: true

# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.

# Read more: https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # Basic dev origins
    dev_origins = [
      %r{http://localhost:\d+},
      %r{http://127\.0\.0\.1:\d+},
      'https://literally-immortal-sunbird.ngrok-free.app',
      %r{https://.+\.trycloudflare\.com}
    ]

    # Explicitly allowed domains for the project
    project_domains = [
      %r{https://.+\.proxysock\.net},
      'https://proxysock.net',
      'https://www.proxysock.net',
      %r{https://.+\.proxysock\.com},
      'https://proxysock.com',
      'https://www.proxysock.com'
    ]

    # Include ENV-defined URLs
    [ENV['APP_URL'], ENV['FRONTEND_URL']].compact.each do |url|
      dev_origins << url
      dev_origins << url.sub('://', '://www.') if url.include?('://')
    end

    origins(*(dev_origins + project_domains))

    resource '*',
             headers: :any,
             methods: %i[get post put patch delete options head],
             credentials: true,
             expose: ['Authorization']
  end
end

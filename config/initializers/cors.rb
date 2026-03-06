# frozen_string_literal: true

# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.

# Read more: https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # Development origins
    dev_origins = [%r{http://localhost:\d+}, %r{http://127\.0\.0\.1:\d+},
                   'http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:5173',
                   'https://literally-immortal-sunbird.ngrok-free.app', %r{https://.+\.trycloudflare\.com}]

    # Production origin from ENV
    if ENV['APP_URL'].present?
      dev_origins << ENV['APP_URL']
      # Also allow www subdomain
      dev_origins << ENV['APP_URL'].sub('://', '://www.')
    end

    origins(*dev_origins)

    resource '*',
             headers: :any,
             methods: %i[get post put patch delete options head],
             credentials: true,
             expose: ['Authorization']
  end
end

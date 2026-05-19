# frozen_string_literal: true

source 'https://rubygems.org'

# Bundle edge Rails instead: gem "rails", github: "rails/rails", branch: "main"
gem 'rails', '~> 8.1.2', '>= 8.1.2.1'
# Use postgresql as the database for Active Record
gem 'pg', '~> 1.1'
# Use the Puma web server [https://github.com/puma/puma]
gem 'puma', '>= 5.0'
# Build JSON APIs with ease [https://github.com/rails/jbuilder]
# gem "jbuilder"

# Use Active Model has_secure_password [https://guides.rubyonrails.org/active_model_basics.html#securepassword]
gem 'bcrypt', '~> 3.1.22'

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem 'tzinfo-data', platforms: %i[windows jruby]

# Use the database-backed adapters for Rails.cache, Active Job, and Action Cable
gem 'solid_cable'
gem 'solid_cache'

# Reduces boot times through caching; required in config/boot.rb
gem 'bootsnap', require: false

# Deploy this application anywhere as a Docker container [https://kamal-deploy.org]
gem 'kamal', require: false

# Add HTTP asset caching/compression and X-Sendfile acceleration to Puma [https://github.com/basecamp/thruster/]
gem 'thruster', require: false

# Use Active Storage variants [https://guides.rubyonrails.org/active_storage_overview.html#transforming-images]
gem 'image_processing', '~> 1.2'

# Use Rack CORS for handling Cross-Origin Resource Sharing (CORS), making cross-origin Ajax possible
gem 'rack-cors'

# Project specific gems
gem 'aasm'
gem 'jwt'
gem 'kaminari'
gem 'redis'
gem 'sidekiq'
gem 'sidekiq-cron', '~> 2.4'

# OAuth/SSO
gem 'omniauth'
gem 'omniauth-google-oauth2'
gem 'omniauth-rails_csrf_protection'
gem 'omniauth-twitter2'
gem 'omniauth-zoho'

# Security: Fix for JSON format string injection vulnerability
gem 'json', '>= 2.19.2'

group :development, :test do
  # See https://guides.rubyonrails.org/debugging_rails_applications.html#debugging-with-the-debug-gem
  gem 'debug', platforms: %i[mri windows], require: 'debug/prelude'

  # Audits gems for known security defects (use config/bundler-audit.yml to ignore issues)
  gem 'bundler-audit', require: false

  # Static analysis for security vulnerabilities [https://brakemanscanner.org/]
  gem 'brakeman', require: false

  # Omakase Ruby styling [https://github.com/rails/rubocop-rails-omakase/]
  gem 'rubocop-rails-omakase', require: false
end

gem 'mocha', '~> 3.0', group: :test

gem 'rswag-api', '~> 2.17'
gem 'rswag-ui', '~> 2.17'

gem 'rspec-rails', '~> 8.0', groups: %i[development test]
gem 'rswag-specs', '~> 2.17', groups: %i[development test]

gem 'sentry-rails', '~> 6.3'
gem 'sentry-ruby', '~> 6.3'
gem 'stackprof'

gem 'dotenv-rails', groups: %i[development test]
gem 'httparty', '~> 0.24.2'

gem 'prometheus-client', '~> 4.2'

gem 'rack-attack', '~> 6.8'

# PDF invoice generation
gem 'prawn', '~> 2.5'
gem 'prawn-table', '~> 0.2'

gem 'resend', '~> 1.0'

gem 'net-ssh', '~> 7.3'

gem 'roo', '~> 2.10'

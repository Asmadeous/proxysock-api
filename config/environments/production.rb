# frozen_string_literal: true

require 'active_support/core_ext/integer/time'
$stdout.sync = true

Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.

  # Code is not reloaded between requests.
  config.enable_reloading = false

  # Eager load code on boot for better performance and memory savings (ignored by Rake tasks).
  config.eager_load = true

  # Full error reports are disabled.
  config.consider_all_requests_local = false

  # Cache assets for far-future expiry since they are all digest stamped.
  config.public_file_server.headers = { 'cache-control' => "public, max-age=#{1.year.to_i}" }

  # Enable serving of images, stylesheets, and JavaScripts from an asset server.
  # config.asset_host = "http://assets.example.com"

  # Store uploaded files on the local file system (see config/storage.yml for options).
  config.active_storage.service = :local

  # Force all access to the app over SSL, use Strict-Transport-Security, and use secure cookies.
  config.force_ssl = true

  # Assume all access to the app is happening through a SSL-terminating reverse proxy.
  config.assume_ssl = true

  # Log to STDOUT with the current request id as a default log tag.
  if ENV["RAILS_LOG_TO_STDOUT"].present?
    config.log_tags = [:request_id]
    
    # Create STDOUT logger
    stdout_logger = ActiveSupport::Logger.new(STDOUT)
    stdout_logger.formatter = config.log_formatter
    
    # Create File logger (unique per role if using shared volume)
    log_suffix = ENV["SERVER_ROLE"].present? ? ".#{ENV["SERVER_ROLE"]}" : ""
    file_logger = ActiveSupport::Logger.new(Rails.root.join("log/#{Rails.env}#{log_suffix}.log"))
    file_logger.formatter = config.log_formatter
    
    # Broadcast to both
    config.logger = ActiveSupport::BroadcastLogger.new(stdout_logger, file_logger)
    config.logger = ActiveSupport::TaggedLogging.new(config.logger)
  end

  # Change to "debug" to log everything (including potentially personally-identifiable information!).
  config.log_level = ENV.fetch('RAILS_LOG_LEVEL', 'info')

  # Prevent health checks from clogging up the logs.
  config.silence_healthcheck_path = '/up'

  # Don't log any deprecations.
  config.active_support.report_deprecations = false

  # Use Sidekiq
  config.active_job.queue_adapter = :sidekiq

  # Use SolidCache (standard Rails 8)
  config.cache_store = :solid_cache_store

  # Action Mailer & URL settings
  config.action_mailer.raise_delivery_errors = true
  config.action_mailer.delivery_method = :resend
  config.action_mailer.perform_caching = false
  config.action_mailer.default_url_options = { host: 'api.proxysock.com', protocol: 'https' }
  Rails.application.routes.default_url_options = { host: 'api.proxysock.com', protocol: 'https' }

  # Enable locale fallbacks for I18n (makes lookups for any locale fall back to
  # the I18n.default_locale when a translation cannot be found).
  config.i18n.fallbacks = true

  # Do not dump schema after migrations.
  config.active_record.dump_schema_after_migration = false

  # Only use :id for inspections in production.
  config.active_record.attributes_for_inspect = [:id]

  # Action Cable configuration
  config.action_cable.allowed_request_origins = [
    'https://proxysock.com',
    'https://www.proxysock.com',
    'https://testprod.proxysock.com',
    %r{https://.+\.proxysock\.com}
  ]
end

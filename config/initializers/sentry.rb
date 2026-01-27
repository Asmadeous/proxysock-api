Sentry.init do |config|
  config.dsn = ENV['SENTRY_DSN']
  # config.breadcrumbs_logger = [:active_support_logger, :http_logger] # Potential circular dependency cause

  # Set traces_sample_rate to 1.0 to capture 100% of transactions for performance monitoring.
  # We recommend adjusting this value in production.
  config.traces_sample_rate = 1.0

  # Enable Sentry in production only (usually)
  config.enabled_environments = %w[production staging]

  config.send_default_pii = true
end

# frozen_string_literal: true

Sentry.init do |config|
  config.dsn = ENV['SENTRY_DSN']
  config.breadcrumbs_logger = %i[active_support_logger http_logger]
  config.enabled_environments = %w[production staging]

  # Add data like request headers and IP for users
  config.send_default_pii = true

  # Enable sending logs to Sentry
  config.enable_logs = true
  # Patch Ruby logger to forward logs
  config.enabled_patches = [:logger]

  # Set traces_sample_rate to 1.0 to capture 100%
  # of transactions for tracing.
  # Adjust this value in production.
  config.traces_sample_rate = 1.0

  # Set profiles_sample_rate to profile 100%
  # of sampled transactions.
  # Adjust this value in production.
  config.profiles_sample_rate = 1.0
end

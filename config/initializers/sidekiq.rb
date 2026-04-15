# frozen_string_literal: true

Sidekiq.configure_server do |config|
  config.redis = { url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/1') }

  # Dual logging for Admin Dashboard (Sidekiq logs)
  if ENV["RAILS_LOG_TO_STDOUT"].present?
    file_logger = Sidekiq::Logger.new(Rails.root.join("log/sidekiq.log"))
    config.logger = ActiveSupport::BroadcastLogger.new(config.logger, file_logger)
  end
end

Sidekiq.configure_client do |config|
  config.redis = { url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/1') }
end

# Ensure mailer jobs discard missing records to avoid DeserializationError log noise
Rails.application.config.after_initialize do
  ActionMailer::MailDeliveryJob.discard_on ActiveJob::DeserializationError
end

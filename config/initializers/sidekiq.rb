# frozen_string_literal: true

Sidekiq.configure_server do |config|
  config.redis = { url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/1') }
end

Sidekiq.configure_client do |config|
  config.redis = { url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/1') }
end

# Ensure mailer jobs discard missing records to avoid DeserializationError log noise
Rails.application.config.after_initialize do
  ActionMailer::MailDeliveryJob.discard_on ActiveJob::DeserializationError
end

# frozen_string_literal: true

class ApplicationJob < ActiveJob::Base
  # Satisfy Sidekiq 8.x processor when jobs are scheduled as raw workers (via sidekiq-cron)
  attr_accessor :jid, :_context

  # Automatically retry jobs that encountered a deadlock
  # retry_on ActiveRecord::Deadlocked

  # Most jobs are safe to ignore if the underlying records are no longer available
  discard_on ActiveJob::DeserializationError
end

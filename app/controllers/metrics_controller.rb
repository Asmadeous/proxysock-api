# frozen_string_literal: true

require 'prometheus/client'
require 'prometheus/client/formats/text'

class MetricsController < ApplicationController
  skip_before_action :verify_authenticity_token, raise: false

  # GET /metrics
  # Prometheus scrape endpoint — returns all metrics in text exposition format
  def index
    refresh_gauges!

    registry = ::Prometheus::Client.registry
    output = ::Prometheus::Client::Formats::Text.marshal(registry)
    render plain: output, content_type: 'text/plain; version=0.0.4; charset=utf-8'
  end

  private

  def refresh_gauges!
    ::ACTIVE_VMS.set(Vm.where(status: 'active').count) if defined?(::ACTIVE_VMS)

    ::ACTIVE_USERS.set(User.count) if defined?(::ACTIVE_USERS)

    if defined?(::SIDEKIQ_JOBS) && defined?(Sidekiq::Stats)
      stats = Sidekiq::Stats.new
      ::SIDEKIQ_JOBS.set(stats.enqueued, labels: { state: 'enqueued' })
      ::SIDEKIQ_JOBS.set(stats.processed, labels: { state: 'processed' })
      ::SIDEKIQ_JOBS.set(stats.failed, labels: { state: 'failed' })
      ::SIDEKIQ_JOBS.set(stats.retry_size, labels: { state: 'retry' })
    end
  rescue StandardError => e
    Rails.logger.warn("[Metrics] Gauge refresh error: #{e.message}")
  end
end

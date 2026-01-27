# frozen_string_literal: true

class HealthController < ApplicationController
  skip_before_action :authenticate_request, raise: false

  def show
    health_status = {
      database: database_connected?,
      redis: redis_connected?,
      timestamp: Time.current.iso8601
    }

    if health_status.values.all?
      render json: { status: 'ok', details: health_status }, status: :ok
    else
      render json: { status: 'error', details: health_status }, status: :service_unavailable
    end
  end

  private

  def database_connected?
    ActiveRecord::Base.connection.active?
  rescue StandardError
    false
  end

  def redis_connected?
    Sidekiq.redis(&:ping) == 'PONG'
  rescue StandardError
    false
  end
end

# frozen_string_literal: true

module Webhooks
  class DispatchService
    def initialize(webhook_endpoint, event_type, payload)
      @endpoint = webhook_endpoint
      @event = event_type
      @payload = payload
    end

    def call
      return unless @endpoint.active?
      return unless subscribed?

      timestamp = Time.now.to_i
      signature = generate_signature(timestamp)

      response = Faraday.post(@endpoint.url) do |req|
        req.headers['Content-Type'] = 'application/json'
        req.headers['X-ProxySock-Event'] = @event
        req.headers['X-ProxySock-Timestamp'] = timestamp.to_s
        req.headers['X-ProxySock-Signature'] = signature
        req.body = @payload.to_json
        req.options.timeout = 5
        req.options.open_timeout = 2
      end

      log_delivery(response)

      response.success?
    rescue Faraday::Error => e
      log_error(e)
      raise e # Re-raise for Sidekiq retry
    end

    private

    def subscribed?
      # If events array is empty, assume all? Or specific sub?
      # Let's say empty = all for now, or require explicit sub.
      @endpoint.events.nil? || @endpoint.events.empty? || @endpoint.events.include?(@event)
    end

    def generate_signature(timestamp)
      data = "#{timestamp}.#{@payload.to_json}"
      OpenSSL::HMAC.hexdigest('SHA256', @endpoint.secret, data)
    end

    def log_delivery(response)
      Rails.logger.info "Webhook delivered to #{@endpoint.id} (#{@endpoint.url}): #{response.status}"
      # Ideally log to database table `WebhookDelivery`
    end

    def log_error(error)
      Rails.logger.error "Webhook failed for #{@endpoint.id}: #{error.message}"
    end
  end
end

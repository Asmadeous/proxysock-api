# frozen_string_literal: true

class WebhookDispatchWorker < ApplicationJob
  queue_as :webhooks

  retry_on Faraday::Error, wait: :exponentially_longer, attempts: 5

  def perform(reseller_id, event_type, payload)
    reseller = Reseller.find(reseller_id)

    reseller.webhook_endpoints.find_each do |endpoint|
      Webhooks::DispatchService.new(endpoint, event_type, payload).call
    end
  end
end

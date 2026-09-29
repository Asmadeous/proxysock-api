# frozen_string_literal: true

# eSIM Access completes orders by webhook. When that webhook never arrives, this polls
# pending orders so the customer still gets their eSIM, and alerts staff if one stays stuck.
class EsimAccessOrderPollJob < ApplicationJob
  queue_as :default

  # Give the webhook a head start before polling.
  GRACE = 5.minutes
  STALE_AFTER = 2.hours

  def perform
    EsimOrder.includes(:order).where(esim_provider: 'esim_access', status: 'pending_provisioning')
             .where(created_at: ...GRACE.ago).where.not(provider_order_no: [nil, '']).find_each do |esim_order|
      EsimAccessFulfillmentService.new(esim_order).fulfill!
      alert_if_stale(esim_order.reload)
    rescue StandardError => e
      Rails.logger.error("[EsimAccessOrderPoll] #{esim_order.provider_order_no}: #{e.message}")
    end
  end

  private

  def alert_if_stale(esim_order)
    return unless esim_order.status == 'pending_provisioning' && esim_order.created_at < STALE_AFTER.ago
    return if esim_order.metadata.to_h['stale_alerted']

    SlackNotifierService.notify(:provisioning_failed, esim_order.order,
                                error: "eSIM Access order #{esim_order.provider_order_no} still pending after 2h")
    esim_order.update!(metadata: esim_order.metadata.to_h.merge('stale_alerted' => true))
  end
end

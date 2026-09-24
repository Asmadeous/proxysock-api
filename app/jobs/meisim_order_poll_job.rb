# frozen_string_literal: true

# MeiSIM has no webhooks: pending orders are polled until delivered or failed.
class MeisimOrderPollJob < ApplicationJob
  queue_as :default

  STALE_AFTER = 24.hours

  def perform
    EsimOrder.includes(:order).where(esim_provider: 'meisim', status: 'pending_provisioning').find_each do |esim_order|
      MeisimOrderService.new(esim_order.order).refresh!(esim_order)
      alert_if_stale(esim_order.reload)
    rescue StandardError => e
      Rails.logger.error("[MeisimOrderPoll] #{esim_order.provider_order_no}: #{e.message}")
    end
  end

  private

  def alert_if_stale(esim_order)
    return unless esim_order.status == 'pending_provisioning' && esim_order.created_at < STALE_AFTER.ago
    return if esim_order.metadata['stale_alerted']

    SlackNotifierService.notify(:provisioning_failed, esim_order.order,
                                error: "MeiSIM order #{esim_order.provider_order_no} still pending after 24h")
    esim_order.update!(metadata: esim_order.metadata.merge('stale_alerted' => true))
  end
end

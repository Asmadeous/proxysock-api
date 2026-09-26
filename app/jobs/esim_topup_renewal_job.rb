# frozen_string_literal: true

# Charges monthly eSIM auto top-ups that are due. Past-due subscriptions are retried on
# every run until the balance covers them or the customer cancels.
class EsimTopupRenewalJob < ApplicationJob
  queue_as :default

  def perform
    EsimTopupSubscription.due.includes(:order, :orderable).find_each do |subscription|
      EsimTopupService.renew!(subscription)
    rescue StandardError => e
      Rails.logger.error("[EsimTopupRenewalJob] Subscription #{subscription.id}: #{e.class}: #{e.message}")
    end
  end
end

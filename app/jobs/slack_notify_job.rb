# frozen_string_literal: true

class SlackNotifyJob < ApplicationJob
  queue_as :default

  # Async Slack notification job for support, tickets, and failed orders.
  # Usage:
  #   SlackNotifyJob.perform_later("new_ticket", ticket.id)
  #   SlackNotifyJob.perform_later("provisioning_failed", order.id, error: "timeout")

  EVENT_MODELS = {
    'new_ticket' => 'Ticket',
    'ticket_reply' => 'Ticket',
    'guest_chat_message' => 'GuestChatMessage',
    'support_chat_message' => 'SupportChatMessage',
    'provisioning_failed' => 'Order'
  }.freeze

  def perform(event, record_id, **opts)
    model_class = EVENT_MODELS[event]
    unless model_class
      Rails.logger.warn("[SlackNotifyJob] Unknown event type: #{event}")
      return
    end

    record = model_class.constantize.find_by(id: record_id)
    unless record
      Rails.logger.warn("[SlackNotifyJob] #{model_class}##{record_id} not found for event #{event}")
      return
    end

    SlackNotifierService.notify(event.to_sym, record, **opts.symbolize_keys)
  end
end

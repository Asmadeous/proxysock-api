# frozen_string_literal: true

class SlackNotifierService
  # Slack Incoming Webhook integration for ProxySock.
  # Sends rich Block Kit notifications for support, tickets, and failed orders.
  #
  # Usage:
  #   SlackNotifierService.notify(:new_ticket, ticket)
  #   SlackNotifierService.notify(:provisioning_failed, order, error: "timeout")

  # Maps logical channels to ENV variable names (lazy-loaded)
  CHANNEL_ENV_MAP = {
    general: 'SLACK_WEBHOOK_URL',
    support: 'SLACK_WEBHOOK_SUPPORT',
    alerts: 'SLACK_WEBHOOK_ALERTS'
  }.freeze

  # Routes event types to channels
  EVENT_CHANNELS = {
    new_ticket: :support,
    ticket_reply: :support,
    guest_chat_message: :support,
    support_chat_message: :support,
    provisioning_failed: :alerts,
    esim_topup_requested: :alerts
  }.freeze

  class << self
    def notify(event, record, **opts)
      channel = EVENT_CHANNELS[event.to_sym] || :general
      webhook_url = resolve_webhook(channel)

      unless webhook_url.present?
        Rails.logger.debug("[SlackNotifierService] No webhook configured for channel :#{channel}, skipping #{event}")
        return false
      end

      blocks = build_blocks(event.to_sym, record, **opts)
      fallback_text = build_fallback(event.to_sym, record, **opts)

      payload = {
        text: fallback_text,
        blocks: blocks
      }.to_json

      post_to_slack(webhook_url, payload)
    rescue StandardError => e
      Rails.logger.error("[SlackNotifierService] Failed to send #{event} notification: #{e.message}")
      false
    end

    private

    def resolve_webhook(channel)
      env_key = CHANNEL_ENV_MAP[channel.to_sym]
      url = ENV[env_key] if env_key
      url.presence || ENV[CHANNEL_ENV_MAP[:general]]
    end

    def post_to_slack(url, payload)
      uri = URI.parse(url)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.open_timeout = 5
      http.read_timeout = 5

      request = Net::HTTP::Post.new(uri.request_uri)
      request['Content-Type'] = 'application/json'
      request.body = payload

      response = http.request(request)

      unless response.is_a?(Net::HTTPSuccess)
        Rails.logger.warn("[SlackNotifierService] Slack returned #{response.code}: #{response.body}")
      end

      response.is_a?(Net::HTTPSuccess)
    end

    # ─── Block Kit Builders ─────────────────────────────────

    def build_blocks(event, record, **opts)
      case event
      when :new_ticket          then ticket_blocks(record, new: true)
      when :ticket_reply        then ticket_blocks(record, new: false, **opts)
      when :guest_chat_message  then guest_chat_blocks(record)
      when :support_chat_message then support_chat_blocks(record)
      when :provisioning_failed then provisioning_failure_blocks(record, **opts)
      when :esim_topup_requested then esim_topup_blocks(record)
      end
    end

    def build_fallback(event, record, **opts)
      case event
      when :new_ticket
        "🎫 New Ticket ##{record.id}: #{record.subject}"
      when :ticket_reply
        sender = opts[:sender_name] || 'Customer'
        "💬 Ticket ##{record.id} reply from #{sender}"
      when :guest_chat_message
        "💬 Guest chat message from #{record.guest_chat&.guest_name}"
      when :support_chat_message
        '💬 Support chat message'
      when :provisioning_failed
        "🚨 Provisioning failed: Order ##{record.order_number}"
      when :esim_topup_requested
        "📲 eSIM top-up to apply: $#{record.topup_value.to_i} on order ##{record.order.order_number} (#{record.reference})"
      end
    end

    # ─── Ticket ─────────────────────────────────────────────

    def ticket_blocks(ticket, new: true, **opts)
      emoji = new ? '🎫' : '💬'
      title = new ? "New Ticket ##{ticket.id}" : "Ticket ##{ticket.id} — New Reply"

      user = ticket.user
      user_label = if user.respond_to?(:company_name) && user.company_name.present?
                     "#{user.company_name} (#{user.email})"
                   else
                     user&.email || 'Unknown'
                   end

      # Identify actor type for context
      actor_type = case user
                   when Reseller then 'Reseller'
                   when User then user.reseller.present? ? 'Managed User' : 'User'
                   else user&.class&.name || 'Unknown'
                   end

      fields = [
        { type: 'mrkdwn', text: "*Subject:*\n#{ticket.subject}" },
        { type: 'mrkdwn', text: "*Priority:*\n#{ticket.priority || 'normal'}" },
        { type: 'mrkdwn', text: "*#{actor_type}:*\n#{user_label}" },
        { type: 'mrkdwn', text: "*Status:*\n#{ticket.status}" }
      ]

      if ticket.order_id.present?
        order = ticket.order
        fields << { type: 'mrkdwn', text: "*Order:*\n#{order&.order_number || ticket.order_id}" }
      end

      blocks = [
        { type: 'header', text: { type: 'plain_text', text: "#{emoji} #{title}", emoji: true } },
        { type: 'section', fields: fields }
      ]

      # Include first message body for new tickets
      if new
        first_msg = ticket.ticket_messages.order(created_at: :asc).first
        if first_msg
          blocks << { type: 'section', text: { type: 'mrkdwn', text: "*Message:*\n> #{first_msg.body.truncate(500)}" } }
        end
      elsif opts[:message_body].present?
        blocks << { type: 'section', text: { type: 'mrkdwn', text: "*Reply:*\n> #{opts[:message_body].truncate(500)}" } }
      end

      blocks << { type: 'context', elements: [{ type: 'mrkdwn', text: "ProxySock Support • #{Time.current.strftime('%b %d, %Y %H:%M UTC')}" }] }
      blocks
    end

    # ─── Guest Chat ─────────────────────────────────────────

    def guest_chat_blocks(message)
      chat = message.guest_chat
      [
        { type: 'header', text: { type: 'plain_text', text: '💬 New Guest Chat Message', emoji: true } },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: "*From:*\n#{chat&.guest_name || 'Anonymous'}" },
            { type: 'mrkdwn', text: "*Email:*\n#{chat&.guest_email || 'N/A'}" }
          ]
        },
        { type: 'section', text: { type: 'mrkdwn', text: "*Message:*\n> #{message.body.truncate(500)}" } },
        { type: 'context', elements: [{ type: 'mrkdwn', text: "ProxySock Live Chat • #{Time.current.strftime('%b %d, %Y %H:%M UTC')}" }] }
      ]
    end

    # ─── Support Chat ───────────────────────────────────────

    def support_chat_blocks(message)
      chat = message.support_chat
      user = chat&.chatable

      user_label = if user.respond_to?(:company_name) && user.company_name.present?
                     "#{user.company_name} (#{user.email})"
                   elsif user.respond_to?(:email)
                     user.email
                   else
                     'Unknown'
                   end

      actor_type = case user
                   when Reseller then 'Reseller'
                   when User then user.reseller.present? ? 'Managed User' : 'User'
                   else user&.class&.name || 'Unknown'
                   end

      [
        { type: 'header', text: { type: 'plain_text', text: '💬 Support Chat Message', emoji: true } },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: "*#{actor_type}:*\n#{user_label}" },
            { type: 'mrkdwn', text: "*Chat ID:*\n#{chat&.id}" }
          ]
        },
        { type: 'section', text: { type: 'mrkdwn', text: "*Message:*\n> #{message.body.truncate(500)}" } },
        { type: 'context', elements: [{ type: 'mrkdwn', text: "ProxySock Support • #{Time.current.strftime('%b %d, %Y %H:%M UTC')}" }] }
      ]
    end

    # ─── Provisioning Failure ───────────────────────────────

    # A paid top-up staff must apply by hand in the MeiSIM portal.
    def esim_topup_blocks(topup)
      order = topup.order
      esim = order.esim_order&.esims&.first
      owner = topup.orderable
      kind = topup.esim_topup_subscription_id ? 'Monthly auto top-up' : 'One-time top-up'
      [
        { type: 'header', text: { type: 'plain_text', text: '📲 eSIM top-up to apply', emoji: true } },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: "*Credit to add:*\n$#{format('%.2f', topup.topup_value)}" },
            { type: 'mrkdwn', text: "*Paid:*\n$#{format('%.2f', topup.price)} (#{kind})" },
            { type: 'mrkdwn', text: "*Line:*\n#{order.product&.name}" },
            { type: 'mrkdwn', text: "*Phone number:*\n#{esim&.msisdn.presence || 'not on file'}" },
            { type: 'mrkdwn', text: "*ICCID:*\n#{esim&.iccid.presence || 'not on file'}" },
            { type: 'mrkdwn', text: "*Customer:*\n#{owner.try(:email) || owner&.id}" }
          ]
        },
        { type: 'context', elements: [{ type: 'mrkdwn', text: "Order `#{order.order_number}` • #{topup.reference} • apply in the MeiSIM portal, then mark it done in the admin panel" }] }
      ]
    end

    def provisioning_failure_blocks(order, **opts)
      error_msg = opts[:error] || 'Unknown error'
      owner = order.orderable

      owner_label = if owner.respond_to?(:company_name) && owner.company_name.present?
                      "#{owner.company_name} (#{owner.email})"
                    elsif owner.respond_to?(:email)
                      owner.email
                    else
                      'Unknown'
                    end

      actor_type = case owner
                   when Reseller then 'Reseller'
                   when User then owner.reseller.present? ? 'Managed User' : 'User'
                   else owner&.class&.name || 'Unknown'
                   end

      [
        { type: 'header', text: { type: 'plain_text', text: '🚨 Provisioning Failed', emoji: true } },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: "*Order:*\n`#{order.order_number}`" },
            { type: 'mrkdwn', text: "*Product:*\n#{order.product&.name}" },
            { type: 'mrkdwn', text: "*#{actor_type}:*\n#{owner_label}" },
            { type: 'mrkdwn', text: "*Amount:*\n$#{format('%.2f', order.total_amount.to_f)}" }
          ]
        },
        { type: 'section', text: { type: 'mrkdwn', text: "*Error:*\n```#{error_msg.truncate(1000)}```" } },
        { type: 'context', elements: [{ type: 'mrkdwn', text: "⚠️ ProxySock Alerts • #{Time.current.strftime('%b %d, %Y %H:%M UTC')}" }] }
      ]
    end
  end
end

# frozen_string_literal: true

class TicketMessage < ApplicationRecord
  belongs_to :ticket
  belongs_to :sender, polymorphic: true

  validates :body, presence: true

  after_create :notify_participants
  after_create_commit :broadcast_to_channel

  private

  def broadcast_to_channel
    TicketChannel.broadcast_to(
      ticket,
      action: 'ticket_message_created',
      message: {
        id: id,
        body: body,
        sender_type: sender_type,
        sender_name: sender.respond_to?(:full_name) ? sender.full_name : 'User',
        sender_online: sender.respond_to?(:last_seen_at) && sender.last_seen_at && sender.last_seen_at > 5.minutes.ago,
        internal: internal_note,
        created_at: created_at
      }
    )
  end

  def notify_participants
    # Notify user if employee responded
    if sender_type == 'Employee'
      if ticket.user
        NotificationService.notify(
          recipient: ticket.user,
          category: 'ticket',
          title: "Ticket ##{ticket.id} Updated",
          message: "Support replied to your ticket: #{ticket.subject}",
          metadata: { ticket_id: ticket.id }
        )
      end
    else
      # If customer responding or creating a ticket
      if ticket.ticket_messages.count <= 1
        # It's a new ticket! Notify all staff
        NotificationService.notify_staff(
          category: 'ticket',
          title: "New Ticket: ##{ticket.id}",
          message: "A new ticket was created: #{ticket.subject}",
          metadata: { ticket_id: ticket.id }
        )
        # Slack: New ticket notification
        SlackNotifyJob.perform_later('new_ticket', ticket.id)
      elsif ticket.assigned_to
        # Just a reply, notify the assigned agent
        NotificationService.notify(
          recipient: ticket.assigned_to,
          category: 'ticket',
          title: "New Reply: Ticket ##{ticket.id}",
          message: "Customer replied to ticket: #{ticket.subject}",
          metadata: { ticket_id: ticket.id }
        )
        # Slack: Ticket reply notification
        SlackNotifyJob.perform_later('ticket_reply', ticket.id, message_body: body)
      else
        # Unassigned reply, notify all staff
        NotificationService.notify_staff(
          category: 'ticket',
          title: "New Reply: Ticket ##{ticket.id}",
          message: "Customer replied to unassigned ticket: #{ticket.subject}",
          metadata: { ticket_id: ticket.id }
        )
        # Slack: Unassigned ticket reply notification
        SlackNotifyJob.perform_later('ticket_reply', ticket.id, message_body: body)
      end
    end
  end
end

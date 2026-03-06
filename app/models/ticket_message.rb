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
          category: 'info',
          title: "Ticket ##{ticket.id} Updated",
          message: "Support replied to your ticket: #{ticket.subject}",
          metadata: { ticket_id: ticket.id }
        )
      end
    elsif ticket.assigned_to
      # Notify assigned employee or all staff if unassigned
      NotificationService.notify(
        recipient: ticket.assigned_to,
        category: 'info',
        title: "New Reply: Ticket ##{ticket.id}",
        message: "Customer replied to ticket: #{ticket.subject}",
        metadata: { ticket_id: ticket.id }
      )
    else
      # If unassigned, notify staff
      Employee.where(role: %w[admin support]).each do |staff|
        NotificationService.notify(
          recipient: staff,
          category: 'info',
          title: "New Ticket: ##{ticket.id}",
          message: "A new ticket requires attention: #{ticket.subject}"
        )
      end
    end
  end
end

# frozen_string_literal: true

class TicketMessage < ApplicationRecord
  belongs_to :ticket
  belongs_to :sender, polymorphic: true

  validates :body, presence: true

  after_create :notify_participants

  private

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
    else
      # Notify assigned employee or all staff if unassigned
      if ticket.assigned_to
        NotificationService.notify(
          recipient: ticket.assigned_to,
          category: 'info',
          title: "New Reply: Ticket ##{ticket.id}",
          message: "Customer replied to ticket: #{ticket.subject}",
          metadata: { ticket_id: ticket.id }
        )
      else
        # If unassigned, notify staff
        Employee.where(role: ['admin', 'support']).each do |staff|
          NotificationService.notify(
            recipient: staff,
            category: 'info',
            title: "New Ticket: ##{ticket.id}",
            message: "A new ticket requires attention: #{ticket.subject}",
            metadata: { ticket_id: ticket.id }
          )
        end
      end
    end
  end
end

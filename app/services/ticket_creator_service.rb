# frozen_string_literal: true

class TicketCreatorService
  # Create a support ticket for a failed order, notify the user, and email Tawk.to.
  #
  # @param order [Order] the failed order
  # @param error_message [String] what went wrong
  # @return [Ticket, nil]
  def self.create_for_failed_order(order, error_message)
    actor = order.orderable # User or Reseller (polymorphic)
    return unless actor

    ticket = Ticket.create!(
      user: actor,
      order: order,
      subject: "Failed Order ##{order.order_number}",
      status: 'open',
      priority: 'high'
    )

    # Add the first message describing the failure
    ticket.ticket_messages.create!(
      sender: system_sender,
      body: build_order_failure_body(order, error_message)
    )

    # Send to Tawk.to via email
    TawkTicketMailer.with(
      ticket: ticket,
      error_message: error_message,
      context: 'Failed Order'
    ).auto_ticket_email.deliver_later

    Rails.logger.info("[TicketCreatorService] Created ticket ##{ticket.id} for failed order ##{order.order_number}")
    ticket
  rescue StandardError => e
    Rails.logger.error("[TicketCreatorService] Failed to create ticket for order #{order&.id}: #{e.message}")
    nil
  end

  # Create a support ticket for a failed deposit, notify the user, and email Tawk.to.
  #
  # @param deposit [Deposit] the failed deposit
  # @param error_message [String] what went wrong
  # @return [Ticket, nil]
  def self.create_for_failed_deposit(deposit, error_message)
    actor = deposit.depositable # User or Reseller (polymorphic)
    return unless actor

    ticket = Ticket.create!(
      user: actor,
      deposit: deposit,
      subject: "Failed Deposit ##{deposit.id}",
      status: 'open',
      priority: 'high'
    )

    # Add the first message describing the failure
    ticket.ticket_messages.create!(
      sender: system_sender,
      body: build_deposit_failure_body(deposit, error_message)
    )

    # Send to Tawk.to via email
    TawkTicketMailer.with(
      ticket: ticket,
      error_message: error_message,
      context: 'Failed Deposit'
    ).auto_ticket_email.deliver_later

    Rails.logger.info("[TicketCreatorService] Created ticket ##{ticket.id} for failed deposit ##{deposit.id}")
    ticket
  rescue StandardError => e
    Rails.logger.error("[TicketCreatorService] Failed to create ticket for deposit #{deposit&.id}: #{e.message}")
    nil
  end

  class << self
    private

    # Use the first admin employee as the "system" sender for automated messages.
    # Falls back to the first employee if no admin exists.
    def system_sender
      Employee.find_by(role: 'admin') || Employee.first
    end

    def build_order_failure_body(order, error_message)
      lines = []
      lines << '⚠️ **Automated Ticket — Failed Order**'
      lines << ''
      lines << "**Order Number:** #{order.order_number}"
      lines << "**Customer:** #{order.orderable&.try(:email) || order.orderable&.try(:username) || 'Unknown'}"
      lines << "**Amount:** $#{order.total_amount}" if order.respond_to?(:total_amount)
      lines << "**Error:** #{error_message}"
      lines << "**Time:** #{Time.current.strftime('%Y-%m-%d %H:%M:%S %Z')}"
      lines << ''
      lines << 'A refund has been automatically attempted. Please review and follow up with the customer.'
      lines.join("\n")
    end

    def build_deposit_failure_body(deposit, error_message)
      lines = []
      lines << '⚠️ **Automated Ticket — Failed Deposit**'
      lines << ''
      lines << "**Deposit ID:** #{deposit.id}"
      lines << "**Gateway:** #{deposit.gateway}"
      lines << "**Customer:** #{deposit.depositable&.try(:email) || deposit.depositable&.try(:username) || 'Unknown'}"
      lines << "**Amount:** $#{deposit.amount}" if deposit.respond_to?(:amount)
      lines << "**Error:** #{error_message}"
      lines << "**Time:** #{Time.current.strftime('%Y-%m-%d %H:%M:%S %Z')}"
      lines << ''
      lines << 'Please investigate the failed deposit and follow up with the customer.'
      lines.join("\n")
    end
  end
end

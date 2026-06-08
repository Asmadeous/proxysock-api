# frozen_string_literal: true

class TawkTicketMailer < ApplicationMailer
  default from: ENV.fetch('MAILER_SENDER_ADDRESS', 'no-reply@proxysock.com')

  def auto_ticket_email
    @ticket = params[:ticket]
    @user = @ticket.user
    @error_message = params[:error_message]
    @context = params[:context] # e.g., "Failed Order", "Failed Deposit"

    # Set Reply-To as the user's email so Tawk.to assigns the ticket to them
    user_email = @user.try(:email) || 'unknown@proxysock.com'
    tawk_email = ENV['TAWK_PROPERTY_EMAIL']

    return unless tawk_email.present?

    mail(
      to: tawk_email,
      reply_to: user_email,
      subject: "Automated Ticket: #{@context} - ##{@ticket.id}"
    )
  end
end

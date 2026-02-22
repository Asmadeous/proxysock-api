# frozen_string_literal: true

class TicketChannel < ApplicationCable::Channel
  def subscribed
    @ticket = Ticket.find_by(id: params[:ticket_id])
    
    if @ticket && authorized_to_view?(@ticket)
      stream_for @ticket
    else
      reject
    end
  end

  def unsubscribed
    stop_all_streams
  end

  private

  def authorized_to_view?(ticket)
    # Employees can view any ticket
    return true if current_employee
    
    # Users/Resellers must own the ticket
    ticket.user == current_user || ticket.user == current_reseller
  end
end

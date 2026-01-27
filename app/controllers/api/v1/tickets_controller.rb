# frozen_string_literal: true

module Api
  module V1
    class TicketsController < BaseController
      def index
        tickets = current_reseller.tickets.order(updated_at: :desc).page(params[:page]).per(20)

        render json: {
          tickets: tickets.map { |t| serialize_ticket(t) },
          meta: pagination_meta(tickets)
        }
      end

      def show
        ticket = current_reseller.tickets.find(params[:id])
        render json: {
          ticket: serialize_ticket(ticket),
          messages: ticket.ticket_messages.where(internal_note: false).includes(:sender).order(created_at: :asc).map do |m|
            serialize_message(m)
          end
        }
      end

      def create
        ticket = current_reseller.tickets.build(ticket_params)

        if ticket.save
          # Create initial message
          ticket.ticket_messages.create!(
            sender: current_reseller,
            body: params[:body]
          )
          render json: { ticket: serialize_ticket(ticket) }, status: :created
        else
          render json: { errors: ticket.errors }, status: :unprocessable_entity
        end
      end

      def reply
        ticket = current_reseller.tickets.find(params[:id])

        message = ticket.ticket_messages.new(
          body: params[:body],
          sender: current_reseller,
          attachments: params[:attachments]
        )

        if message.save
          ticket.update(status: 'open', updated_at: Time.current) # Re-open if closed
          render json: { message: serialize_message(message) }
        else
          render json: { errors: message.errors }, status: :unprocessable_entity
        end
      end

      private

      def ticket_params
        params.require(:ticket).permit(:subject, :priority, :order_id)
      end

      def serialize_ticket(ticket)
        {
          id: ticket.id,
          subject: ticket.subject,
          status: ticket.status,
          updated_at: ticket.updated_at
        }
      end

      def serialize_message(message)
        {
          id: message.id,
          body: message.body,
          sender_type: message.sender_type == 'Reseller' ? 'You' : 'Support',
          created_at: message.created_at
        }
      end

      def pagination_meta(collection)
        {
          current_page: collection.current_page,
          total_pages: collection.total_pages,
          total_count: collection.total_count
        }
      end
    end
  end
end

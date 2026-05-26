# frozen_string_literal: true

module Api
  module V1
    class TicketsController < BaseController
      def index
        tickets = current_reseller.tickets.includes(:ticket_messages).order(updated_at: :desc).page(params[:page]).per(20)

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
        # Resolve and Validate order_id
        processed_params = ticket_params.to_h
        if processed_params[:order_id].blank? && processed_params[:deposit_id].blank?
          return render json: { errors: { base: ['An Order ID or Deposit ID must be provided to open a ticket.'] } }, status: :unprocessable_entity
        end

        if processed_params[:order_id].present?
          order = if processed_params[:order_id].to_s.match?(/\A\d+\z/)
                    current_reseller.orders.find_by(id: processed_params[:order_id])
                  else
                    current_reseller.orders.find_by(order_number: processed_params[:order_id])
                  end

          if order
            processed_params[:order_id] = order.id
          else
            return render json: { errors: { order_id: ['is invalid or does not belong to you'] } },
                          status: :unprocessable_entity
          end
        end

        if processed_params[:deposit_id].present?
          deposit = current_reseller.deposits.find_by(id: processed_params[:deposit_id])
          if deposit
            processed_params[:deposit_id] = deposit.id
          else
            return render json: { errors: { deposit_id: ['is invalid or does not belong to you'] } },
                          status: :unprocessable_entity
          end
        end

        body_content = params[:body] || params[:message] || (params[:ticket] && params[:ticket][:body])
        if body_content.blank?
          return render json: { errors: { body: ["can't be blank"] } }, status: :unprocessable_entity
        end

        ticket = current_reseller.tickets.build(processed_params.except(:body))

        if ticket.save
          # Create initial message
          ticket.ticket_messages.create!(
            sender: current_reseller,
            body: body_content
          )
          render json: { ticket: serialize_ticket(ticket) }, status: :created
        else
          render json: { errors: ticket.errors }, status: :unprocessable_entity
        end
      end

      def reply
        ticket = current_reseller.tickets.find(params[:id])
        body_content = params[:body] || params[:message]

        message = ticket.ticket_messages.new(
          body: body_content,
          sender: current_reseller,
          attachments: params[:attachments]
        )

        if message.save
          ticket.update(status: 'open', updated_at: Time.current) # Re-open if closed
          render json: { message: serialize_message(message) }, status: :created
        else
          render json: { errors: message.errors }, status: :unprocessable_entity
        end
      end

      private

      def ticket_params
        params.require(:ticket).permit(:subject, :priority, :order_id, :body)
      end

      def serialize_ticket(ticket)
        {
          id: ticket.id,
          subject: ticket.subject,
          status: ticket.status,
          user_type: ticket.user_type,
          messages_count: ticket.ticket_messages.size,
          body: ticket.ticket_messages.order(created_at: :asc).first&.body,
          created_at: ticket.created_at,
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

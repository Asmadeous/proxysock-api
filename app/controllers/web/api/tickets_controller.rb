# frozen_string_literal: true

module Web
  module Api
    class TicketsController < BaseController
      def index
        tickets = current_actor.tickets.includes(:ticket_messages).order(updated_at: :desc).page(params[:page]).per(20)

        render json: {
          tickets: tickets.map { |t| serialize_ticket(t) },
          meta: {
            current_page: tickets.current_page,
            total_pages: tickets.total_pages,
            total_count: tickets.total_count
          }
        }
      end

      def show
        ticket = current_actor.tickets.find(params[:id])
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
        if processed_params[:order_id].present?
          order = if processed_params[:order_id].to_s.match?(/\A\d+\z/)
                    Order.find_by(id: processed_params[:order_id])
                  else
                    Order.find_by(order_number: processed_params[:order_id])
                  end

          if order
            processed_params[:order_id] = order.id
          else
            return render json: { errors: { order_id: ["is invalid or does not exist"] } }, status: :unprocessable_entity
          end
        end

        if processed_params[:deposit_id].present?
          deposit = Deposit.find_by(id: processed_params[:deposit_id])
          if deposit
            processed_params[:deposit_id] = deposit.id
          else
            return render json: { errors: { deposit_id: ["is invalid or does not exist"] } }, status: :unprocessable_entity
          end
        end

        ticket = current_actor.tickets.build(processed_params.except(:body))

        if ticket.save
          body_content = params[:body] || params[:message] || (params[:ticket] && params[:ticket][:body])
          ticket.ticket_messages.create!(
            sender: current_actor,
            body: body_content
          )
          render json: { ticket: serialize_ticket(ticket) }, status: :created
        else
          render json: { errors: ticket.errors }, status: :unprocessable_entity
        end
      end

      def reply
        ticket = current_actor.tickets.find(params[:id])
        body_content = params[:body] || params[:message]

        message = ticket.ticket_messages.new(
          body: body_content,
          sender: current_actor,
          attachments: params[:attachments]
        )

        if message.save
          ticket.update(status: 'open', updated_at: Time.current)
          render json: { message: serialize_message(message) }
        else
          render json: { errors: message.errors }, status: :unprocessable_entity
        end
      end

      private

      def ticket_params
        params.require(:ticket).permit(:subject, :priority, :order_id, :deposit_id, :body)
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
          sender_type: ['User', 'Reseller'].include?(message.sender_type) ? 'You' : 'Support',
          created_at: message.created_at
        }
      end

    end
  end
end

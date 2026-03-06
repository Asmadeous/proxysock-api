# frozen_string_literal: true

module Admin
  module Api
    class TicketsController < BaseController
      def index
        # Scoped Access Logic
        tickets = if current_employee.role == 'support'
                    # Support sees unassigned tickets OR assigned to them
                    Ticket.where(assigned_to: current_employee)
                          .or(Ticket.where(assigned_to: nil))
                  else
                    # Admin/Manager sees all
                    Ticket.all
                  end

        tickets = tickets.includes(:user, :last_message,
                                   :ticket_messages).order(updated_at: :desc).page(params[:page]).per(20)

        # Filtering
        tickets = tickets.where(status: params[:status]) if params[:status].present?

        render json: {
          tickets: tickets.map { |t| serialize_ticket(t) },
          meta: pagination_meta(tickets)
        }
      end

      def show
        ticket = Ticket.find(params[:id])
        authorize_ticket_access!(ticket)

        render json: {
          ticket: serialize_ticket(ticket),
          messages: ticket.ticket_messages.includes(:sender).order(created_at: :asc).map { |m| serialize_message(m) },
          order: ticket.order ? { id: ticket.order.id, status: ticket.order.status } : nil
        }
      end

      def reply
        ticket = Ticket.find(params[:id])
        authorize_ticket_access!(ticket)

        message = ticket.ticket_messages.new(
          body: params[:body] || params[:message],
          sender: current_employee,
          internal_note: params[:internal_note] || false,
          attachments: params[:attachments]
        )

        if message.save
          ticket.update(status: 'in_progress', updated_at: Time.current)
          render json: { message: serialize_message(message) }
        else
          render json: { errors: message.errors }, status: :unprocessable_entity
        end
      end

      def update
        ticket = Ticket.find(params[:id])
        authorize_ticket_access!(ticket)

        if ticket.update(ticket_params)
          render json: { ticket: serialize_ticket(ticket) }
        else
          render json: { errors: ticket.errors }, status: :unprocessable_entity
        end
      end

      # Order Rescue Action
      def rescue_order
        ticket = Ticket.find(params[:id])
        authorize_ticket_access!(ticket)

        unless ticket.order
          return render json: { error: 'No order linked to this ticket' }, status: :unprocessable_entity
        end

        # Trigger re-provisioning logic
        # For simplicity, we restart the provisioning service
        OrderProvisioningService.new(ticket.order, current_employee).process!

        ticket.ticket_messages.create!(
          sender: current_employee,
          body: "Triggered 'Rescue' operation for Order ##{ticket.order.id}",
          internal_note: true
        )

        render json: { message: "Rescue operation triggered for Order ##{ticket.order.id}" }
      rescue StandardError => e
        render json: { error: e.message }, status: :internal_server_error
      end

      private

      def authorize_ticket_access!(ticket)
        return if %w[admin manager].include?(current_employee.role)

        return if ticket.assigned_to_id == current_employee.id || ticket.assigned_to_id.nil?

        raise ActionController::RoutingError, 'Not Found' # Hide unauthorized tickets
      end

      def ticket_params
        params.require(:ticket).permit(:status, :priority, :assigned_to_id)
      end

      def serialize_ticket(ticket)
        {
          id: ticket.id,
          subject: ticket.subject,
          status: ticket.status,
          priority: ticket.priority,
          user_email: ticket.user&.email,
          user_type: ticket.user_type,
          user_online: ticket.user.respond_to?(:last_seen_at) && (ticket.user.last_seen_at&.> 5.minutes.ago),
          assigned_to: ticket.assigned_to&.full_name,
          messages_count: ticket.ticket_messages.size,
          created_at: ticket.created_at,
          updated_at: ticket.updated_at
        }
      end

      def serialize_message(message)
        {
          id: message.id,
          body: message.body,
          sender_type: message.sender_type,
          sender_name: message.sender.respond_to?(:full_name) ? message.sender.full_name : 'User',
          sender_online: message.sender.respond_to?(:last_seen_at) && message.sender.last_seen_at && message.sender.last_seen_at > 5.minutes.ago,
          internal: message.internal_note,
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

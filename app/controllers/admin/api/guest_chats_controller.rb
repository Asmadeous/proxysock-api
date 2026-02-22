# frozen_string_literal: true

module Admin
  module Api
    class GuestChatsController < BaseController
      # GET /admin/api/guest_chats
      def index
        chats = GuestChat.recent.includes(:assigned_to).page(params[:page]).per(25)

        chats = chats.where(status: params[:status]) if params[:status].present?

        render json: {
          chats: chats.map { |c| serialize_chat(c) },
          meta: {
            current_page: chats.current_page,
            total_pages: chats.total_pages,
            total_count: chats.total_count
          },
          stats: {
            total: GuestChat.count,
            open: GuestChat.where(status: 'open').count,
            assigned: GuestChat.where(status: 'assigned').count,
            closed: GuestChat.where(status: 'closed').count
          }
        }
      end

      # GET /admin/api/guest_chats/:id
      def show
        chat = GuestChat.find(params[:id])

        render json: {
          chat: serialize_chat(chat),
          messages: chat.guest_chat_messages.order(created_at: :asc).map { |m| serialize_message(m) }
        }
      end

      # POST /admin/api/guest_chats/:id/reply
      def reply
        chat = GuestChat.find(params[:id])

        message = chat.guest_chat_messages.create!(
          body: params[:message],
          sender_type: 'employee',
          sender_id: current_employee.id
        )

        # Auto-assign if not already assigned
        if chat.status == 'open'
          chat.update!(status: 'assigned', assigned_to: current_employee)
        end

        AuditLog.create(
          action: 'guest_chat_reply',
          actor: current_employee,
          target: chat,
          metadata: { message_id: message.id }
        ) rescue nil

        render json: { message: serialize_message(message) }
      end

      # POST /admin/api/guest_chats/:id/assign
      def assign
        chat = GuestChat.find(params[:id])
        employee = Employee.find(params[:employee_id])

        chat.update!(assigned_to: employee, status: 'assigned')

        render json: { chat: serialize_chat(chat) }
      end

      # POST /admin/api/guest_chats/:id/close
      def close
        chat = GuestChat.find(params[:id])
        chat.close!

        render json: { chat: serialize_chat(chat) }
      end

      private

      def serialize_chat(chat)
        {
          id: chat.id,
          guest_name: chat.guest_name,
          guest_email: chat.guest_email,
          subject: chat.subject,
          status: chat.status,
          assigned_to: chat.assigned_to&.full_name,
          assigned_to_id: chat.assigned_to_id,
          created_at: chat.created_at,
          updated_at: chat.updated_at,
          message_count: chat.guest_chat_messages.count,
          last_message: chat.guest_chat_messages.order(created_at: :desc).first&.body&.truncate(80)
        }
      end

      def serialize_message(msg)
        is_employee = msg.sender_type == 'employee'
        sender = is_employee ? Employee.find_by(id: msg.sender_id) : nil
        {
          id: msg.id,
          body: msg.body,
          sender_type: msg.sender_type,
          sender_id: msg.sender_id,
          sender_name: sender&.full_name,
          sender_online: sender && sender.respond_to?(:last_seen_at) && sender.last_seen_at && sender.last_seen_at > 5.minutes.ago,
          created_at: msg.created_at
        }
      end
    end
  end
end

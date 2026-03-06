# frozen_string_literal: true

module Admin
  module Api
    class SupportChatsController < BaseController
      def index
        chats = SupportChat.includes(:chatable, :assigned_to).order(updated_at: :desc).page(params[:page]).per(20)
        render json: {
          chats: chats.map { |c| serialize_chat_summary(c) },
          meta: pagination_meta(chats)
        }
      end

      def show
        chat = SupportChat.find(params[:id])
        render json: {
          chat: serialize_chat(chat),
          messages: chat.support_chat_messages.includes(:sender).order(created_at: :asc).map do |m|
            serialize_message(m)
          end
        }
      end

      def reply
        chat = SupportChat.find(params[:id])
        return render json: { error: 'Chat is closed' }, status: :forbidden if chat.status == 'closed'

        message = chat.support_chat_messages.create!(
          body: params[:message] || params[:body],
          sender: current_employee
        )

        # Auto-assign if unassigned
        chat.update!(assigned_to: current_employee, status: 'assigned') if chat.assigned_to.nil?

        render json: { message: serialize_message(message) }, status: :created
      end

      def assign
        chat = SupportChat.find(params[:id])
        employee = Employee.find(params[:employee_id])
        chat.update!(assigned_to: employee, status: 'assigned')
        render json: { chat: serialize_chat(chat) }
      end

      def close
        chat = SupportChat.find(params[:id])
        chat.close!
        render json: { message: 'Chat closed successfully' }
      end

      private

      def serialize_chat_summary(chat)
        {
          id: chat.id,
          chatable_type: chat.chatable_type,
          chatable_name: if chat.chatable.respond_to?(:full_name)
                           chat.chatable.full_name
                         else
                           chat.chatable.respond_to?(:email) ? chat.chatable.email : chat.chatable_type
                         end,
          status: chat.status,
          assigned_to: chat.assigned_to&.full_name,
          updated_at: chat.updated_at
        }
      end

      def serialize_chat(chat)
        {
          id: chat.id,
          chatable_type: chat.chatable_type,
          chatable_id: chat.chatable_id,
          chatable_name: chat.chatable.respond_to?(:full_name) ? chat.chatable.full_name : chat.chatable_type,
          status: chat.status,
          session_token: chat.session_token,
          assigned_to_id: chat.assigned_to_id,
          assigned_to_name: chat.assigned_to&.full_name,
          created_at: chat.created_at
        }
      end

      def serialize_message(msg)
        {
          id: msg.id,
          body: msg.body,
          sender_type: msg.sender_type,
          sender_name: msg.sender.respond_to?(:full_name) ? msg.sender.full_name : 'User',
          sender_online: msg.sender.respond_to?(:last_seen_at) && msg.sender.last_seen_at && msg.sender.last_seen_at > 5.minutes.ago,
          created_at: msg.created_at
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

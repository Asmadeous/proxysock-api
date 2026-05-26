# frozen_string_literal: true

module Web
  module Api
    class SupportChatsController < BaseController
      def index
        chat = find_or_open_chat
        render json: {
          chat: serialize_chat(chat),
          messages: chat.support_chat_messages.includes(:sender).order(created_at: :asc).map do |m|
            serialize_message(m)
          end
        }
      end

      def show
        chat = SupportChat.find_by!(chatable: current_actor, session_token: params[:id])
        render json: {
          chat: serialize_chat(chat),
          messages: chat.support_chat_messages.includes(:sender).order(created_at: :asc).map do |m|
            serialize_message(m)
          end
        }
      end

      def add_message
        chat = find_or_open_chat

        message = chat.support_chat_messages.create!(
          body: params[:message] || params[:body],
          sender: current_actor
        )

        render json: { message: serialize_message(message), chat: serialize_chat(chat) }, status: :created
      end

      private

      # Find the user's active (non-closed) chat, or create a fresh one.
      # This ensures users can always start a new conversation after a chat is closed.
      def find_or_open_chat
        SupportChat.where(chatable: current_actor).where.not(status: 'closed').order(updated_at: :desc).first ||
          SupportChat.create!(chatable: current_actor)
      end

      def serialize_chat(chat)
        {
          id: chat.id,
          status: chat.status,
          session_token: chat.session_token,
          assigned_to_name: chat.assigned_to&.full_name,
          assigned_to_online: chat.assigned_to&.last_seen_at && chat.assigned_to.last_seen_at > 5.minutes.ago,
          created_at: chat.created_at
        }
      end

      def serialize_message(msg)
        {
          id: msg.id,
          body: msg.body,
          sender_type: msg.sender_type,
          sender_name: msg.sender_type == 'Employee' ? msg.sender&.full_name : 'You',
          sender_online: msg.sender_type == 'Employee' && msg.sender&.last_seen_at && msg.sender.last_seen_at > 5.minutes.ago,
          created_at: msg.created_at
        }
      end
    end
  end
end

# frozen_string_literal: true

module Api
  module V1
    class GuestChatsController < ApplicationController
      skip_before_action :authenticate_user!, raise: false

      # POST /api/v1/guest_chats — Start a new chat
      def create
        chat = GuestChat.new(
          guest_name: params[:guest_name],
          guest_email: params[:guest_email],
          subject: params[:subject] || 'General Inquiry'
        )

        if chat.save
          # Create first message if provided
          if params[:message].present?
            chat.guest_chat_messages.create!(
              body: params[:message],
              sender_type: 'guest'
            )
          end

          render json: {
            chat: serialize_chat(chat),
            session_token: chat.session_token
          }, status: :created
        else
          render json: { errors: chat.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # GET /api/v1/guest_chats/:session_token — Get chat by session token
      def show
        chat = GuestChat.find_by!(session_token: params[:id])

        render json: {
          chat: serialize_chat(chat),
          messages: chat.guest_chat_messages.order(created_at: :asc).map { |m| serialize_message(m) }
        }
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Chat not found' }, status: :not_found
      end

      # POST /api/v1/guest_chats/:session_token/messages — Guest sends a message
      def add_message
        chat = GuestChat.find_by!(session_token: params[:id])

        return render json: { error: 'Chat is closed' }, status: :forbidden if chat.status == 'closed'

        message = chat.guest_chat_messages.create!(
          body: params[:message],
          sender_type: 'guest'
        )

        render json: { message: serialize_message(message) }, status: :created
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Chat not found' }, status: :not_found
      end

      private

      def serialize_chat(chat)
        {
          id: chat.id,
          guest_name: chat.guest_name,
          guest_email: chat.guest_email,
          subject: chat.subject,
          status: chat.status,
          created_at: chat.created_at,
          updated_at: chat.updated_at,
          message_count: chat.guest_chat_messages.count,
          assigned_to_name: chat.assigned_to&.full_name,
          assigned_to_online: chat.assigned_to&.last_seen_at && chat.assigned_to.last_seen_at > 5.minutes.ago
        }
      end

      def serialize_message(msg)
        {
          id: msg.id,
          body: msg.body,
          sender_type: msg.sender_type,
          sender_id: msg.sender_id,
          sender_name: msg.sender_type == 'employee' ? msg.sender&.full_name : 'Guest',
          sender_online: msg.sender_type == 'employee' && msg.sender&.last_seen_at && msg.sender.last_seen_at > 5.minutes.ago,
          created_at: msg.created_at
        }
      end
    end
  end
end

# frozen_string_literal: true

module Webhooks
  class TawkController < ApplicationController
    skip_before_action :verify_authenticity_token, raise: false

    def create
      signature = request.headers['X-Tawk-Signature']
      body = request.raw_post

      unless valid_signature?(signature, body)
        return render json: { error: 'Invalid signature' }, status: :unauthorized
      end

      payload = JSON.parse(body)
      event = payload['event']

      case event
      when 'chat:start'
        handle_chat_start(payload)
      when 'chat:end'
        handle_chat_end(payload)
      when 'ticket:create'
        handle_ticket_create(payload)
      end

      head :ok
    rescue JSON::ParserError
      head :bad_request
    end

    private

    def valid_signature?(signature, body)
      # If webhook secret is not set in env, skip verification for local dev (optional)
      return true unless ENV['TAWK_WEBHOOK_SECRET'].present?
      return false unless signature.present?

      expected_signature = OpenSSL::HMAC.hexdigest('SHA1', ENV['TAWK_WEBHOOK_SECRET'], body)
      ActiveSupport::SecurityUtils.secure_compare(signature, expected_signature)
    end

    def handle_chat_start(payload)
      chat_data = payload['chat'] || {}
      visitor = payload['visitor'] || {}
      
      find_or_create_local_chat(chat_data['id'], visitor, 'open')
    end

    def handle_chat_end(payload)
      chat_data = payload['chat'] || {}
      visitor = payload['visitor'] || {}
      
      chat = find_or_create_local_chat(chat_data['id'], visitor, 'closed')
      
      # Try to save transcript if available
      transcript = payload.dig('chat', 'transcript')
      if transcript.present? && chat.present?
        if chat.is_a?(SupportChat)
          SupportChatMessage.create!(
            support_chat: chat,
            sender_type: 'System',
            body: "Chat Transcript:\n\n#{transcript}"
          )
        elsif chat.is_a?(GuestChat)
          GuestChatMessage.create!(
            guest_chat: chat,
            sender_type: 'System',
            body: "Chat Transcript:\n\n#{transcript}"
          )
        end
      end
    end

    def handle_ticket_create(payload)
      # Optionally convert Tawk tickets to local tickets
    end

    def find_or_create_local_chat(tawk_chat_id, visitor, status)
      return nil unless tawk_chat_id.present?

      email = visitor['email'] || "visitor-#{tawk_chat_id}@tawk.local"
      name = visitor['name'] || 'Tawk.to Visitor'
      
      # Try to find user
      user = User.find_by(email: email) || Reseller.find_by(email: email)
      session_token = "tawk_#{tawk_chat_id}"

      if user
        chat = SupportChat.find_or_initialize_by(session_token: session_token)
        chat.chatable = user if chat.new_record?
        chat.subject = "Tawk.to Chat #{tawk_chat_id}" if chat.new_record?
        chat.status = status
        chat.save!
        chat
      else
        chat = GuestChat.find_or_initialize_by(session_token: session_token)
        chat.guest_email = email if chat.new_record?
        chat.guest_name = name if chat.new_record?
        chat.subject = "Tawk.to Chat #{tawk_chat_id}" if chat.new_record?
        chat.status = status
        chat.save!
        chat
      end
    rescue StandardError => e
      Rails.logger.error "Failed to create local chat from Tawk webhook: #{e.message}"
      nil
    end
  end
end

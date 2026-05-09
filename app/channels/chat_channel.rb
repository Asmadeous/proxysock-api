# frozen_string_literal: true

class ChatChannel < ApplicationCable::Channel
  def subscribed
    @chat = resolve_chat

    if @chat && authorized_to_view?(@chat)
      stream_for @chat
    else
      reject
    end
  end

  def unsubscribed
    # Any custom cleanup logic can go here.
    # Note: ActionCable automatically handles stop_all_streams on unsubscribe.
  end

  private

  def resolve_chat
    type = params[:chat_type]
    id = params[:chat_id]

    # 1. If ID is provided and is a valid UUID, use it
    if id.present? && id != 'current' && id.match?(/\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\z/i)
      # Try both possible types if not specified
      types = type.present? ? [type] : %w[SupportChat GuestChat]
      types.each do |t|
        next unless %w[SupportChat GuestChat].include?(t)

        chat = t.constantize.find_by(id: id)
        return chat if chat
      end
    end

    # 2. Fallback: Find the most recent active chat for the current connection
    if current_user
      SupportChat.where(chatable: current_user).recent.first
    elsif current_reseller
      SupportChat.where(chatable: current_reseller).recent.first
    elsif guest_session_id
      GuestChat.find_by(session_token: guest_session_id)
    end
  rescue StandardError
    nil
  end

  def authorized_to_view?(chat)
    return true if current_employee # Employees can view any valid chat

    if chat.is_a?(SupportChat)
      chat.chatable == current_user || chat.chatable == current_reseller
    elsif chat.is_a?(GuestChat)
      guest_session_id == chat.session_token
    else
      false
    end
  end
end

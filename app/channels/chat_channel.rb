# frozen_string_literal: true

class ChatChannel < ApplicationCable::Channel
  def subscribed
    # Clients must pass chat_id and chat_type ("SupportChat" or "GuestChat")
    @chat = find_chat(params[:chat_type], params[:chat_id])
    
    if @chat && authorized_to_view?(@chat)
      stream_for @chat
    else
      reject
    end
  end

  def unsubscribed
    # Any cleanup needed when channel is closed
    stop_all_streams
  end

  private

  def find_chat(type, id)
    return nil unless %w[SupportChat GuestChat].include?(type)
    type.constantize.find_by(id: id)
  end

  def authorized_to_view?(chat)
    # Employees can view all chats assigned to them or unassigned
    return true if current_employee

    if chat.is_a?(SupportChat)
      # For users/resellers, they must own the chat
      chat.chatable == current_user || chat.chatable == current_reseller
    elsif chat.is_a?(GuestChat)
      # For guest chats, the connection must carry the matching guest_token
      guest_session_id == chat.session_token
    else
      false
    end
  end
end

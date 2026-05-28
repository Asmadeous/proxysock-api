# frozen_string_literal: true

class GuestChatMessage < ApplicationRecord
  belongs_to :guest_chat
  belongs_to :sender, class_name: 'Employee', optional: true

  validates :body, presence: true
  validates :sender_type, inclusion: { in: %w[guest employee] }

  after_create :touch_chat
  after_create :notify_staff_on_reply, if: -> { sender_type == 'guest' }
  after_create_commit :broadcast_to_channel

  private

  def broadcast_to_channel
    ChatChannel.broadcast_to(
      guest_chat,
      action: 'message_created',
      message: {
        id: id,
        body: body,
        sender_type: sender_type,
        sender_name: sender_type == 'guest' ? guest_chat.guest_name : sender&.full_name || 'Support',
        created_at: created_at
      }
    )
  end

  def notify_staff_on_reply
    # If assigned, notify the specific employee. Otherwise notify all admins.
    if guest_chat.assigned_to
      NotificationService.notify(
        recipient: guest_chat.assigned_to,
        category: 'info',
        title: "New message from #{guest_chat.guest_name}",
        message: body.truncate(50),
        metadata: { guest_chat_id: guest_chat.id, session_token: guest_chat.session_token }
      )
    else
      NotificationService.notify_staff(
        category: 'info',
        title: "Guest Chat Update: #{guest_chat.guest_name}",
        message: body.truncate(50),
        metadata: { guest_chat_id: guest_chat.id, session_token: guest_chat.session_token }
      )
    end

    # Slack: Guest chat notification
    SlackNotifyJob.perform_later('guest_chat_message', id)
  end

  def touch_chat
    guest_chat.touch
  end
end

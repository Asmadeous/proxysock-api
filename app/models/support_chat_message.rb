# frozen_string_literal: true

class SupportChatMessage < ApplicationRecord
  belongs_to :support_chat
  belongs_to :sender, polymorphic: true

  validates :body, presence: true

  after_create :touch_chat
  after_create :notify_recipient
  after_create_commit :broadcast_to_channel

  private

  def broadcast_to_channel
    ChatChannel.broadcast_to(
      support_chat,
      action: 'message_created',
      message: {
        id: id,
        body: body,
        sender_type: sender_type,
        sender_name: sender.respond_to?(:full_name) ? sender.full_name : sender_type,
        created_at: created_at
      }
    )
  end

  def notify_recipient
    if sender_type == 'Employee'
      # Notify the user
      NotificationService.notify(
        recipient: support_chat.chatable,
        category: 'info',
        title: "New Support Message",
        message: body.truncate(50),
        metadata: { support_chat_id: support_chat.id }
      )
    else
      # Notify the assigned employee or all staff
      if support_chat.assigned_to
        NotificationService.notify(
          recipient: support_chat.assigned_to,
          category: 'info',
          title: "Message from #{support_chat.chatable.respond_to?(:full_name) ? support_chat.chatable.full_name : support_chat.chatable_type}",
          message: body.truncate(50),
          metadata: { support_chat_id: support_chat.id, session_token: support_chat.session_token }
        )
      else
        Employee.where(role: ['admin', 'support']).each do |staff|
          NotificationService.notify(
            recipient: staff,
            category: 'info',
            title: "Support Chat Update: #{support_chat.chatable_type}",
            message: body.truncate(50),
            metadata: { support_chat_id: support_chat.id, session_token: support_chat.session_token }
          )
        end
      end
    end
  end

  def touch_chat
    support_chat.touch
  end
end

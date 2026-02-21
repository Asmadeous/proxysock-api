# frozen_string_literal: true

class GuestChatMessage < ApplicationRecord
  belongs_to :guest_chat
  belongs_to :sender, class_name: 'Employee', optional: true

  validates :body, presence: true
  validates :sender_type, inclusion: { in: %w[guest employee] }

  after_create :touch_chat
  after_create :notify_staff_on_reply, if: -> { sender_type == 'guest' }

  private

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
      Employee.where(role: 'admin').each do |admin|
        NotificationService.notify(
          recipient: admin,
          category: 'info',
          title: "Guest Chat Update: #{guest_chat.guest_name}",
          message: body.truncate(50),
          metadata: { guest_chat_id: guest_chat.id, session_token: guest_chat.session_token }
        )
      end
    end
  end

  def touch_chat
    guest_chat.touch
  end
end

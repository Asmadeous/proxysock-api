# frozen_string_literal: true

class NotificationService
  def self.notify(recipient:, title:, message:, category: 'info', metadata: {})
    # Create the notification record
    notification = Notification.create!(
      recipient: recipient,
      category: category,
      title: title,
      message: message,
      metadata: metadata
    )

    # Broadcast to the recipient's channel
    broadcast(notification)

    notification
  rescue StandardError => e
    Rails.logger.error("[NotificationService] Failed to notify: #{e.message}")
    nil
  end

  def self.broadcast(notification)
    # Determine the stream name based on recipient type
    stream_name = case notification.recipient_type
                  when 'User'
                    "user_#{notification.recipient_id}"
                  when 'Reseller'
                    "reseller_#{notification.recipient_id}"
                  when 'Employee'
                    "employee_#{notification.recipient_id}"
                  else
                    return
                  end

    # Broadcast using ActionCable
    ActionCable.server.broadcast(
      stream_name,
      {
        id: notification.id,
        category: notification.category,
        title: notification.title,
        message: notification.message,
        metadata: notification.metadata,
        created_at: notification.created_at
      }
    )
  end
end

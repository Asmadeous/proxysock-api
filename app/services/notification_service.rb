# frozen_string_literal: true

class NotificationService
  def self.notify(recipient:, title:, message:, category: 'info', metadata: {})
    # Create the notification record
    Notification.create!(
      recipient: recipient,
      category: category,
      title: title,
      message: message,
      metadata: metadata
    )
  rescue StandardError => e
    Rails.logger.error("[NotificationService] Failed to notify: #{e.message}")
    nil
  end
end

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

  def self.notify_staff(title:, message:, category: 'info', metadata: {})
    staff_ids = Employee.where(active: true, role: %w[admin support]).pluck(:id)
    return if staff_ids.empty?

    time = Time.current
    payloads = staff_ids.map do |id|
      {
        recipient_type: 'Employee',
        recipient_id: id,
        category: category,
        title: title,
        message: message,
        metadata: metadata.to_json,
        created_at: time,
        updated_at: time
      }
    end

    # Bulk insert avoids N+1 queries and time complexity issues
    Notification.insert_all(payloads)

    # Broadcast to websocket channels efficiently
    staff_ids.each do |id|
      NotificationChannel.broadcast_to(
        GlobalID::Locator.locate("gid://proxysock/Employee/#{id}"),
        action: 'notifications_refresh'
      )
    end
  rescue StandardError => e
    Rails.logger.error("[NotificationService] Failed to notify staff: #{e.message}")
  end
end

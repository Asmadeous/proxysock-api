# frozen_string_literal: true

class NotificationService
  STAFF_ROLES = %w[admin support].freeze

  # Single recipient.
  #
  # Relies on Notification#after_create_commit, which fires after the OUTERMOST
  # transaction commits — so this is safe even when called from inside another
  # model's transaction (e.g. an after_create callback on a chat message).
  def self.notify(recipient:, title:, message:, category: 'info', metadata: {})
    Notification.create!(
      recipient: recipient,
      category: category,
      title: title,
      message: message,
      metadata: metadata
    )
  rescue StandardError => e
    Rails.logger.error("[NotificationService] notify failed: #{e.message}")
    nil
  end

  # Fan-out to all active staff.
  #
  # One bulk INSERT (no N+1), and the websocket fan-out is deferred until the
  # surrounding transaction commits so clients never append data that could
  # still be rolled back. Emits inline `notification_created` payloads (same as
  # the single path) rather than a `notifications_refresh` signal, so N staff
  # clients append locally instead of each hitting the API to refetch.
  def self.notify_staff(title:, message:, category: 'info', metadata: {})
    recipient_ids = Employee.where(active: true, role: STAFF_ROLES).pluck(:id)
    return if recipient_ids.empty?

    now = Time.current
    rows = recipient_ids.map do |recipient_id|
      {
        recipient_type: 'Employee',
        recipient_id: recipient_id,
        category: category,
        title: title,
        message: message,
        metadata: metadata,
        created_at: now,
        updated_at: now
      }
    end

    inserted = Notification.insert_all(rows, returning: %w[id recipient_id created_at])

    AfterCommit.run do
      inserted.rows.each do |id, recipient_id, created_at|
        Notification.broadcast_created_to(
          Employee.new(id: recipient_id),
          {
            id: id,
            title: title,
            message: message,
            category: category,
            metadata: metadata,
            created_at: created_at,
            read_at: nil
          }
        )
      end
    end
  rescue StandardError => e
    Rails.logger.error("[NotificationService] notify_staff failed: #{e.message}")
  end
end

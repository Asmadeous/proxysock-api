# frozen_string_literal: true

class Notification < ApplicationRecord
  belongs_to :recipient, polymorphic: true

  validates :title, presence: true
  validates :message, presence: true
  validates :category, presence: true, inclusion: { in: %w[info warning error success system_alert] }

  scope :unread, -> { where(read_at: nil) }
  scope :recent, -> { order(created_at: :desc) }

  after_create_commit :broadcast_to_channel

  def mark_as_read!
    update!(read_at: Time.current)
  end

  private

  def broadcast_to_channel
    NotificationChannel.broadcast_to(
      recipient,
      action: 'notification_created',
      notification: {
        id: id,
        title: title,
        message: message,
        category: category,
        metadata: metadata,
        created_at: created_at,
        read_at: read_at
      }
    )
  end
end

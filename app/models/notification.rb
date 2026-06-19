# frozen_string_literal: true

class Notification < ApplicationRecord
  belongs_to :recipient, polymorphic: true

  validates :title, presence: true
  validates :message, presence: true
  validates :category, presence: true, inclusion: { in: %w[info warning error success system_alert] }

  scope :unread, -> { where(read_at: nil) }
  scope :recent, -> { order(created_at: :desc) }

  after_create_commit :broadcast_created

  # Pushes a single notification payload to a recipient's stream.
  #
  # Shared by the model callback (single create) and NotificationService.notify_staff
  # (bulk insert_all, which bypasses callbacks) so both fan out identically and
  # clients can append inline — no refetch required.
  #
  # `recipient` only needs to respond to #to_gid_param, so an unpersisted
  # Employee.new(id:) works and avoids an extra DB load when fanning out to many.
  def self.broadcast_created_to(recipient, attrs)
    NotificationChannel.broadcast_to(recipient, action: 'notification_created', notification: attrs)
  end

  def mark_as_read!
    update!(read_at: Time.current)
  end

  def broadcast_payload
    {
      id: id,
      title: title,
      message: message,
      category: category,
      metadata: metadata,
      created_at: created_at,
      read_at: read_at
    }
  end

  private

  def broadcast_created
    self.class.broadcast_created_to(recipient, broadcast_payload)
  end
end

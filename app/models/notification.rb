class Notification < ApplicationRecord
  belongs_to :recipient, polymorphic: true
  
  validates :title, presence: true
  validates :message, presence: true
  validates :category, presence: true, inclusion: { in: %w[info warning error success system_alert] }

  scope :unread, -> { where(read_at: nil) }
  scope :recent, -> { order(created_at: :desc) }

  def mark_as_read!
    update!(read_at: Time.current)
  end
end

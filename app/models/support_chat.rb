# frozen_string_literal: true

class SupportChat < ApplicationRecord
  belongs_to :chatable, polymorphic: true
  belongs_to :assigned_to, class_name: 'Employee', optional: true
  has_many :support_chat_messages, dependent: :destroy

  validates :status, inclusion: { in: %w[open assigned closed] }
  validates :session_token, presence: true, uniqueness: true

  before_validation :generate_session_token, on: :create
  after_create :notify_staff

  scope :open_chats, -> { where(status: %w[open assigned]) }
  scope :recent, -> { order(updated_at: :desc) }

  def close!
    update!(status: 'closed')
  end

  private

  def notify_staff
    Employee.where(role: ['admin', 'support']).each do |employee|
      NotificationService.notify(
        recipient: employee,
        category: 'info',
        title: "New Support Chat Inquiry",
        message: "A #{chatable_type} has started a new support chat.",
        metadata: { support_chat_id: id, session_token: session_token }
      )
    end
  end

  def generate_session_token
    self.session_token ||= SecureRandom.urlsafe_base64(32)
  end
end

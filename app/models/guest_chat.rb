# frozen_string_literal: true

class GuestChat < ApplicationRecord
  has_many :guest_chat_messages, dependent: :destroy
  belongs_to :assigned_to, class_name: 'Employee', optional: true

  validates :guest_name, presence: true
  validates :guest_email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :status, inclusion: { in: %w[open assigned closed] }

  before_create :generate_session_token
  after_create :notify_staff

  scope :open_chats, -> { where(status: %w[open assigned]) }
  scope :recent, -> { order(updated_at: :desc) }

  def close!
    update!(status: 'closed')
  end

  private

  def notify_staff
    Employee.where(role: %w[admin support]).each do |employee|
      NotificationService.notify(
        recipient: employee,
        category: 'info',
        title: 'New Guest Chat Inquiry',
        message: "#{guest_name} has started a new chat inquiry: #{subject}",
        metadata: { guest_chat_id: id, session_token: session_token }
      )
    end
  end

  def generate_session_token
    self.session_token = SecureRandom.urlsafe_base64(32)
  end
end

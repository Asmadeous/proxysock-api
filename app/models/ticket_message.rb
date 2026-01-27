# frozen_string_literal: true

class TicketMessage < ApplicationRecord
  belongs_to :ticket
  belongs_to :sender, polymorphic: true

  validates :body, presence: true

  after_create :notify_participants

  private

  def notify_participants
    # Logic to email user/reseller if sender is employee
    # Logic to email support/assigned agent if sender is user
    # TicketMailer.new_message(self).deliver_later
  end
end

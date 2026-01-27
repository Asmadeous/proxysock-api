# frozen_string_literal: true

class Ticket < ApplicationRecord
  belongs_to :user, polymorphic: true
  belongs_to :assigned_to, class_name: 'Employee', optional: true
  belongs_to :order, optional: true

  has_many :ticket_messages, dependent: :destroy

  validates :subject, presence: true
  validates :status, inclusion: { in: %w[open in_progress resolved closed] }

  scope :open_tickets, -> { where(status: %w[open in_progress]) }
  scope :assigned_to_me, ->(employee_id) { where(assigned_to_id: employee_id) }

  after_create :auto_assign

  private

  def auto_assign
    TicketAssignmentService.new(self).call
  end
end

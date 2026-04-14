# frozen_string_literal: true

class UsaEsimCredential < ApplicationRecord
  belongs_to :usa_esim_order, foreign_key: 'order_id', optional: true
  belongs_to :user, optional: true

  has_one_attached :qr_code_image

  validates :iccid, presence: true, uniqueness: true
  validates :provider, presence: true
  validates :status, inclusion: { in: %w[available assigned] }

  validate :prevent_reassignment, on: :update

  private

  def prevent_reassignment
    if status_was == 'assigned' && status == 'available'
      errors.add(:status, 'cannot be changed back to available once assigned')
    end

    return unless order_id_was.present? && order_id_changed?

    errors.add(:order_id, 'cannot be reassigned once set')
  end
end

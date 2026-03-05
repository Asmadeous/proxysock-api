class UsaEsimCredential < ApplicationRecord
  belongs_to :usa_esim_order, foreign_key: 'order_id', optional: true
  belongs_to :user, optional: true

  validate :prevent_reassignment, on: :update

  private

  def prevent_reassignment
    if status_was == 'assigned' && status == 'available'
      errors.add(:status, "cannot be changed back to available once assigned")
    end

    if order_id_was.present? && order_id_changed?
      errors.add(:order_id, "cannot be reassigned once set")
    end
  end
end

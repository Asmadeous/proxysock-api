# frozen_string_literal: true

class Transaction < ApplicationRecord
  belongs_to :transactable, polymorphic: true # User or Reseller
  belongs_to :reference, polymorphic: true # Order, Deposit, etc

  validate :validate_immutability, on: :update
  before_destroy :prevent_destroy
  after_create :notify_user

  private

  def notify_user
    Notification.create(
      recipient: transactable,
      category: 'success',
      title: "Transaction Processed",
      message: "Your transaction of #{amount} #{currency} has been recorded."
    ) if transactable
  end

  def validate_immutability
    errors.add(:base, 'Transactions are immutable')
  end

  def prevent_destroy
    errors.add(:base, 'Transactions cannot be deleted')
    throw :abort
  end
end

class Transaction < ApplicationRecord
  belongs_to :transactable, polymorphic: true # User or Reseller
  belongs_to :reference, polymorphic: true # Order, Deposit, etc
  
  validate :validate_immutability, on: :update
  before_destroy :prevent_destroy
  
  private
  
  def validate_immutability
    errors.add(:base, "Transactions are immutable")
  end
  
  def prevent_destroy
    errors.add(:base, "Transactions cannot be deleted")
    throw :abort
  end
end

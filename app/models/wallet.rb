class Wallet < ApplicationRecord
  belongs_to :owner, polymorphic: true
  belongs_to :user, optional: true # Deprecated
  
  has_many :wallet_transactions, dependent: :destroy
  
  def balance
    # Cache balance check or sum. For now, trusting sum of transactions is safer strictly.
    # Alternatively, ensure LedgerService updates a 'cached_balance' column if we add one.
    wallet_transactions.sum(:amount)
  end
  
  def credit!(amount, description, metadata = {})
    LedgerService.new(self).record_entry(amount, 'credit', description, metadata)
  end
  
  def debit!(amount, description, metadata = {})
    LedgerService.new(self).record_entry(amount, 'debit', description, metadata)
  end
  
  def verify_ledger_integrity!
    LedgerService.new(self).verify_integrity!
  end
end

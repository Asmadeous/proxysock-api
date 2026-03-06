# frozen_string_literal: true

class Wallet < ApplicationRecord
  belongs_to :owner, polymorphic: true
  belongs_to :user, optional: true # Deprecated

  TYPES = %w[main earnings].freeze

  validates :wallet_type, inclusion: { in: TYPES }
  validates :wallet_type, uniqueness: { scope: %i[owner_id owner_type] }

  has_many :wallet_transactions, dependent: :destroy

  def balance
    # Cache balance check or sum. For now, trusting sum of transactions is safer strictly.
    # Alternatively, ensure LedgerService updates a 'cached_balance' column if we add one.
    wallet_transactions.sum(:amount)
  end

  def currency
    'USD'
  end

  def credit!(amount, description, metadata = {}, reference = nil)
    LedgerService.new(self).record_entry(amount, 'credit', description, metadata, reference)
  end

  def debit!(amount, description, metadata = {}, reference = nil)
    LedgerService.new(self).record_entry(amount, 'debit', description, metadata, reference)
  end

  def verify_ledger_integrity!
    LedgerService.new(self).verify_integrity!
  end
end

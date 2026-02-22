# frozen_string_literal: true

class WalletTransaction < ApplicationRecord
  belongs_to :wallet
  belongs_to :financial_transaction, class_name: 'Transaction', foreign_key: 'transaction_id', optional: true

  after_save :clear_wallet_cache
  after_destroy :clear_wallet_cache

  private

  def clear_wallet_cache
    if wallet&.owner_type == 'User'
      Rails.cache.delete("user_#{wallet.owner_id}_wallet_balance")
    end
  end
end

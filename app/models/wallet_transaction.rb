# frozen_string_literal: true

class WalletTransaction < ApplicationRecord
  belongs_to :wallet, touch: true
  belongs_to :financial_transaction, class_name: 'Transaction', foreign_key: 'transaction_id', optional: true

  after_save :clear_wallet_cache
  after_destroy :clear_wallet_cache

  private

  def clear_wallet_cache
    if wallet&.owner_type == 'User'
      Rails.cache.delete("user_#{wallet.owner_id}_wallet_balance")
      # Also delete the v1 cache key if we use it without timestamp elsewhere
      Rails.cache.delete("user_#{wallet.owner_id}_wallet_balance_v1")
    end
  end
end

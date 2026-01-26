class WalletTransaction < ApplicationRecord
  belongs_to :wallet
  belongs_to :financial_transaction, class_name: 'Transaction', foreign_key: 'transaction_id', optional: true
end

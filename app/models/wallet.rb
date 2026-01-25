class Wallet < ApplicationRecord
  belongs_to :user
  has_many :wallet_transactions
  
  def balance
    wallet_transactions.sum(:amount)
  end
end

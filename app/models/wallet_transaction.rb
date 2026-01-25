class WalletTransaction < ApplicationRecord
  belongs_to :wallet
  belongs_to :transaction # The immutable master transaction
end

class AddLedgerFields < ActiveRecord::Migration[8.1]
  def change
    unless column_exists?(:wallet_transactions, :entry_hash)
      add_column :wallet_transactions, :entry_hash, :string
    end
    unless column_exists?(:wallet_transactions, :parent_hash)
      add_column :wallet_transactions, :parent_hash, :string
    end
    unless column_exists?(:wallet_transactions, :locked_at)
      add_column :wallet_transactions, :locked_at, :datetime
    end
    
    unless index_exists?(:wallet_transactions, :entry_hash)
      add_index :wallet_transactions, :entry_hash, unique: true
    end
    unless index_exists?(:wallet_transactions, :parent_hash)
      add_index :wallet_transactions, :parent_hash
    end
    unless index_exists?(:wallet_transactions, [:wallet_id, :created_at])
      add_index :wallet_transactions, [:wallet_id, :created_at]
    end
  end
end

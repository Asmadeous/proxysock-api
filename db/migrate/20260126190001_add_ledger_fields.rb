# frozen_string_literal: true

class AddLedgerFields < ActiveRecord::Migration[8.1]
  def change
    add_column :wallet_transactions, :entry_hash, :string unless column_exists?(:wallet_transactions, :entry_hash)
    add_column :wallet_transactions, :parent_hash, :string unless column_exists?(:wallet_transactions, :parent_hash)
    add_column :wallet_transactions, :locked_at, :datetime unless column_exists?(:wallet_transactions, :locked_at)

    add_index :wallet_transactions, :entry_hash, unique: true unless index_exists?(:wallet_transactions, :entry_hash)
    add_index :wallet_transactions, :parent_hash unless index_exists?(:wallet_transactions, :parent_hash)
    return if index_exists?(:wallet_transactions, %i[wallet_id created_at])

    add_index :wallet_transactions, %i[wallet_id created_at]
  end
end

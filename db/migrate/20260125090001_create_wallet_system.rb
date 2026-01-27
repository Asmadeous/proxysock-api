# frozen_string_literal: true

class CreateWalletSystem < ActiveRecord::Migration[8.0]
  def change
    create_table :wallets do |t|
      t.references :user, null: false, foreign_key: true
      t.string :status, default: 'active'

      t.timestamps
    end

    create_table :wallet_transactions do |t|
      t.references :wallet, null: false, foreign_key: true
      t.references :transaction, null: false, foreign_key: true # Audit link to main transactions
      t.string :transaction_type # deposit, charge, refund, bonus
      t.decimal :amount
      t.decimal :balance_before
      t.decimal :balance_after
      t.string :description
      t.jsonb :metadata

      t.timestamps
    end

    create_table :deposits do |t|
      t.references :user, null: false, foreign_key: true
      t.references :transaction, foreign_key: true # Optional link to completed transaction
      t.decimal :amount
      t.string :currency
      t.string :gateway
      t.string :status
      t.references :payment_method, foreign_key: true
      t.datetime :initiated_at
      t.datetime :completed_at
      t.datetime :expires_at
      t.jsonb :metadata

      t.timestamps
    end

    # Add polymorphic billing history if not already present or modify it
    # We already have billing_histories with reseller_id. We need to make it polymorphic.
    # Check if we need to migrate existing billing_histories

    # Using 'safety' check
    return if column_exists?(:billing_histories, :billable_type)

    # Rename reseller_id to billable_id and add type
    rename_column :billing_histories, :reseller_id, :billable_id
    add_column :billing_histories, :billable_type, :string, default: 'Reseller'
  end
end

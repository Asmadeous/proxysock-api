# frozen_string_literal: true

class CreatePaymentGatewayTransactions < ActiveRecord::Migration[8.0]
  def change
    create_table :payment_gateway_transactions do |t|
      t.references :transaction, null: false, foreign_key: true
      t.string :gateway
      t.string :gateway_transaction_id
      t.string :gateway_reference
      t.decimal :amount
      t.string :currency
      t.string :status
      t.jsonb :request_payload
      t.jsonb :response_payload
      t.jsonb :webhook_payload
      t.datetime :verified_at

      t.timestamps
    end
    add_index :payment_gateway_transactions, :gateway_transaction_id, unique: true
  end
end

class CreateTransactions < ActiveRecord::Migration[8.1]
  def change
    create_table :transactions do |t|
      t.references :transactable, polymorphic: true, null: false
      t.string :transaction_type
      t.decimal :amount
      t.string :currency
      t.string :description
      t.references :reference, polymorphic: true, null: false
      t.string :payment_gateway
      t.string :gateway_transaction_id
      t.string :gateway_reference
      t.string :status
      t.jsonb :metadata

      t.timestamps
    end
  end
end

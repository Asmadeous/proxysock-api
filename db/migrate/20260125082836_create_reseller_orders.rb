# frozen_string_literal: true

class CreateResellerOrders < ActiveRecord::Migration[8.0]
  def change
    create_table :reseller_orders do |t|
      t.references :reseller, null: false, foreign_key: true
      t.references :product, null: false, foreign_key: true
      t.references :product_pricing, null: false, foreign_key: true
      t.references :orderable, polymorphic: true, null: false
      t.string :order_number
      t.string :status
      t.decimal :total_amount
      t.string :currency
      t.datetime :expires_at
      t.string :provider_order_id
      t.jsonb :metadata

      t.timestamps
    end
    add_index :reseller_orders, :order_number, unique: true
  end
end

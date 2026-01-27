# frozen_string_literal: true

class CreateMasterOrders < ActiveRecord::Migration[8.0]
  def change
    create_table :orders do |t|
      t.string :order_number
      t.references :orderable, polymorphic: true, null: false # ResellOrder or EcommerceOrder
      t.references :product, null: false, foreign_key: true
      t.references :product_pricing, null: false, foreign_key: true
      t.string :status
      t.decimal :total_amount
      t.string :currency
      t.datetime :expires_at
      t.string :provider_order_id
      t.jsonb :metadata

      t.timestamps
    end
    add_index :orders, :order_number, unique: true
  end
end

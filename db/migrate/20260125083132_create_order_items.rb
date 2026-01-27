# frozen_string_literal: true

class CreateOrderItems < ActiveRecord::Migration[8.1]
  def change
    create_table :order_items do |t|
      t.references :ecommerce_order, null: false, foreign_key: true
      t.references :product, null: false, foreign_key: true
      t.references :product_pricing, null: false, foreign_key: true
      t.integer :quantity
      t.decimal :unit_price
      t.decimal :total_price
      t.jsonb :metadata

      t.timestamps
    end
  end
end

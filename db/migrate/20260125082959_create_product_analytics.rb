# frozen_string_literal: true

class CreateProductAnalytics < ActiveRecord::Migration[8.1]
  def change
    create_table :product_analytics do |t|
      t.date :date
      t.references :product, null: false, foreign_key: true
      t.integer :views
      t.integer :add_to_cart_count
      t.integer :purchase_count
      t.decimal :revenue
      t.decimal :conversion_rate

      t.timestamps
    end
  end
end

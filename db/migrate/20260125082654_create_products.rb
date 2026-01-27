# frozen_string_literal: true

class CreateProducts < ActiveRecord::Migration[8.1]
  def change
    create_table :products do |t|
      t.references :product_category, null: false, foreign_key: true
      t.string :name
      t.string :slug
      t.string :product_type
      t.string :provider
      t.string :provider_product_id
      t.text :description
      t.boolean :active
      t.jsonb :metadata

      t.timestamps
    end
    add_index :products, :slug
  end
end

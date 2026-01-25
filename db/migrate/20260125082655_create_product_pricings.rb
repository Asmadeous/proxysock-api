class CreateProductPricings < ActiveRecord::Migration[8.1]
  def change
    create_table :product_pricings do |t|
      t.references :product, null: false, foreign_key: true
      t.string :duration_type
      t.integer :duration_value
      t.decimal :cost_price
      t.decimal :selling_price
      t.decimal :margin_percentage
      t.string :currency
      t.boolean :active

      t.timestamps
    end
  end
end

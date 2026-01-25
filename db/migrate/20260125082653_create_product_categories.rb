class CreateProductCategories < ActiveRecord::Migration[8.1]
  def change
    create_table :product_categories do |t|
      t.string :name
      t.string :slug
      t.string :category_type
      t.text :description
      t.boolean :active
      t.jsonb :metadata

      t.timestamps
    end
    add_index :product_categories, :slug
  end
end

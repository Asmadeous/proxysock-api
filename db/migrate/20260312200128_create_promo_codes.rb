class CreatePromoCodes < ActiveRecord::Migration[8.1]
  def change
    create_table :promo_codes, id: :uuid do |t|
      t.string :code
      t.string :discount_type
      t.decimal :discount_value
      t.integer :max_uses
      t.integer :current_uses, default: 0
      t.datetime :expires_at
      t.boolean :active, default: true
      t.decimal :min_order_amount
      t.decimal :max_discount_amount
      t.string :description
      t.uuid :created_by_id

      t.timestamps
    end
    add_index :promo_codes, :code, unique: true
  end
end

class CreateConversions < ActiveRecord::Migration[8.1]
  def change
    create_table :conversions do |t|
      t.references :user_session, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.references :product, null: false, foreign_key: true
      t.references :cart, null: false, foreign_key: true
      t.references :ecommerce_order, null: false, foreign_key: true
      t.string :funnel_stage
      t.integer :time_to_convert_seconds

      t.timestamps
    end
  end
end

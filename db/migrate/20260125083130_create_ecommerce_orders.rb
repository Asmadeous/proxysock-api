class CreateEcommerceOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :ecommerce_orders do |t|
      t.references :user, null: false, foreign_key: true
      t.string :order_number
      t.string :status
      t.decimal :subtotal
      t.decimal :tax
      t.decimal :total
      t.string :currency
      t.string :payment_method
      t.datetime :paid_at
      t.datetime :fulfilled_at
      t.datetime :cancelled_at
      t.datetime :refunded_at
      t.jsonb :metadata

      t.timestamps
    end
    add_index :ecommerce_orders, :order_number
  end
end

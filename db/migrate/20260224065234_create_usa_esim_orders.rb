class CreateUsaEsimOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :usa_esim_orders, id: :uuid do |t|
      t.references :order, null: false, foreign_key: true
      t.string :status
      t.string :provider
      t.integer :quantity
      t.decimal :total_amount

      t.timestamps
    end
  end
end

# frozen_string_literal: true

class CreateEsimOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :esim_orders do |t|
      t.references :order, null: false, foreign_key: { to_table: :reseller_orders }
      t.string :esim_provider
      t.string :package_code
      t.decimal :data_amount_gb
      t.integer :duration_days
      t.string :country_code
      t.string :status

      t.timestamps
    end
  end
end

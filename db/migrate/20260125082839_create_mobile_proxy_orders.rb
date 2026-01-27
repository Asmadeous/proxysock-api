# frozen_string_literal: true

class CreateMobileProxyOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :mobile_proxy_orders do |t|
      t.references :order, null: false, foreign_key: { to_table: :reseller_orders }
      t.string :proxy_source
      t.integer :quantity
      t.string :country_code
      t.boolean :rotation_enabled
      t.string :status

      t.timestamps
    end
  end
end

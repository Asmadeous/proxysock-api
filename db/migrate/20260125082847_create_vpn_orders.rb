# frozen_string_literal: true

class CreateVpnOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :vpn_orders do |t|
      t.references :order, null: false, foreign_key: { to_table: :reseller_orders }
      t.string :myproxyapi_order_id
      t.string :country_code
      t.string :status

      t.timestamps
    end
  end
end

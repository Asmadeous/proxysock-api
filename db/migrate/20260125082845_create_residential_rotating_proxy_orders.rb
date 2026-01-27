# frozen_string_literal: true

class CreateResidentialRotatingProxyOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :residential_rotating_proxy_orders do |t|
      t.references :order, null: false, foreign_key: { to_table: :reseller_orders }
      t.string :myproxyapi_order_id
      t.string :myproxyapi_username
      t.decimal :traffic_gb_total
      t.decimal :traffic_gb_used
      t.datetime :traffic_expires_at
      t.string :status

      t.timestamps
    end
  end
end

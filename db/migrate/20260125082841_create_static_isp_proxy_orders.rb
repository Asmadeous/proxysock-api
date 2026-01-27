# frozen_string_literal: true

class CreateStaticIspProxyOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :static_isp_proxy_orders do |t|
      t.references :order, null: false, foreign_key: { to_table: :reseller_orders }
      t.string :myproxyapi_order_id
      t.string :isp_type
      t.integer :quantity
      t.string :country_code
      t.string :protocol
      t.string :status

      t.timestamps
    end
  end
end

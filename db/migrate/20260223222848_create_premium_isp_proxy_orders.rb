class CreatePremiumIspProxyOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :premium_isp_proxy_orders do |t|
      t.references :order, null: false, foreign_key: true
      t.string :status
      t.datetime :expires_at

      t.timestamps
    end
  end
end

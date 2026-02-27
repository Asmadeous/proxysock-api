class CreatePremiumIspProxies < ActiveRecord::Migration[8.1]
  def change
    create_table :premium_isp_proxies do |t|
      t.references :premium_isp_proxy_order, null: false, foreign_key: true
      t.string :ip_address
      t.integer :port
      t.string :username
      t.string :password
      t.string :protocol
      t.string :location
      t.string :isp
      t.boolean :active

      t.timestamps
    end
  end
end

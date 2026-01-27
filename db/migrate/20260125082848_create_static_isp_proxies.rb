# frozen_string_literal: true

class CreateStaticIspProxies < ActiveRecord::Migration[8.1]
  def change
    create_table :static_isp_proxies do |t|
      t.references :static_isp_proxy_order, null: false, foreign_key: true
      t.string :myproxyapi_order_id
      t.string :isp_type
      t.string :ip_address
      t.integer :port
      t.string :username
      t.string :password
      t.string :protocol
      t.string :country_code
      t.jsonb :whitelisted_ips
      t.string :status
      t.jsonb :metadata

      t.timestamps
    end
  end
end

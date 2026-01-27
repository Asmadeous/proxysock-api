# frozen_string_literal: true

class CreateStaticDatacenterProxies < ActiveRecord::Migration[8.1]
  def change
    create_table :static_datacenter_proxies do |t|
      t.references :static_datacenter_proxy_order, null: false, foreign_key: true
      t.string :myproxyapi_order_id
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

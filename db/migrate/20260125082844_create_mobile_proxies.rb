# frozen_string_literal: true

class CreateMobileProxies < ActiveRecord::Migration[8.1]
  def change
    create_table :mobile_proxies do |t|
      t.references :mobile_proxy_order, null: false, foreign_key: true
      t.string :proxy_source
      t.string :xproxy_order_id
      t.string :myproxyapi_order_id
      t.string :ip_address
      t.integer :port
      t.string :username
      t.string :password
      t.string :country_code
      t.integer :rotation_interval_minutes
      t.jsonb :whitelisted_ips
      t.string :status
      t.jsonb :metadata

      t.timestamps
    end
  end
end

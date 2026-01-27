# frozen_string_literal: true

class CreateResidentialRotatingProxies < ActiveRecord::Migration[8.1]
  def change
    create_table :residential_rotating_proxies do |t|
      t.references :residential_rotating_proxy_order, null: false, foreign_key: true
      t.string :myproxyapi_order_id
      t.string :hostname
      t.integer :port
      t.string :main_username
      t.string :main_password
      t.decimal :traffic_gb_total
      t.decimal :traffic_gb_used
      t.string :status
      t.jsonb :metadata

      t.timestamps
    end
  end
end

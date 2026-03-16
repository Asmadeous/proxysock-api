# frozen_string_literal: true

class CreateGlobalIspTables < ActiveRecord::Migration[8.1]
  def change
    create_table :global_isp_proxies, id: :uuid do |t|
      t.uuid :order_id, index: true
      t.string :myproxyapi_order_id, index: true
      t.string :ip_address
      t.integer :port
      t.string :username
      t.string :password
      t.string :country_code
      t.string :city
      t.string :isp_name
      t.datetime :expires_at
      t.jsonb :metadata, default: {}

      t.timestamps
    end

    create_table :global_isp_proxy_orders, id: :uuid do |t|
      t.uuid :order_id, null: false, index: true
      t.uuid :global_isp_proxy_id, index: true
      t.string :myproxyapi_order_id
      t.string :target_section_id
      t.string :target_id

      t.timestamps
    end
  end
end

class AddMissingColumnsToPremiumIspProxies < ActiveRecord::Migration[7.1]
  def change
    add_column :premium_isp_proxies, :order_id, :uuid
    add_column :premium_isp_proxies, :status, :string, default: 'available'
    add_column :premium_isp_proxies, :country_code, :string
    add_column :premium_isp_proxies, :expires_at, :datetime
    add_column :premium_isp_proxies, :myproxyapi_order_id, :string
    add_column :premium_isp_proxies, :metadata, :jsonb, default: {}

    add_index :premium_isp_proxies, :order_id
    add_index :premium_isp_proxies, :status
    add_index :premium_isp_proxies, :myproxyapi_order_id

    add_foreign_key :premium_isp_proxies, :orders
  end
end

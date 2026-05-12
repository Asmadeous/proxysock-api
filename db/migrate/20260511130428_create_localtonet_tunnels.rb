# frozen_string_literal: true

class CreateLocaltonetTunnels < ActiveRecord::Migration[8.1]
  def change
    unless table_exists?(:localtonet_tunnels)
      create_table :localtonet_tunnels, id: :uuid, default: -> { 'gen_random_uuid()' } do |t|
        t.bigint   :localtonet_tunnel_id, null: false  # Their numeric tunnel ID
        t.string   :auth_token                         # Phone's auth token
        t.string   :hostname, null: false               # Public hostname
        t.integer  :port, null: false                   # Public port
        t.string   :protocol_type, default: 'http'      # http / socks5
        t.string   :carrier                             # AT&T, T-Mobile, Verizon, etc.
        t.string   :country_code, default: 'US'
        t.string   :status, default: 'active'           # active / offline / maintenance
        t.string   :title                               # Friendly name from LocalToNet
        t.string   :current_ip                          # Current mobile IP
        t.datetime :last_health_check_at
        t.datetime :last_ip_rotated_at
        t.jsonb    :metadata, default: {}
        t.timestamps

        t.index :localtonet_tunnel_id, unique: true
        t.index :country_code
        t.index :status
      end
    end

    # Add LocalToNet-specific columns to mobile_proxies safely
    unless column_exists?(:mobile_proxies, :localtonet_tunnel_id)
      add_column :mobile_proxies, :localtonet_tunnel_id, :uuid
    end
    unless column_exists?(:mobile_proxies, :localtonet_client_id)
      add_column :mobile_proxies, :localtonet_client_id, :string
    end
    unless column_exists?(:mobile_proxies, :carrier)
      add_column :mobile_proxies, :carrier, :string
    end
    unless column_exists?(:mobile_proxies, :proxy_type)
      add_column :mobile_proxies, :proxy_type, :string
    end
    unless column_exists?(:mobile_proxies, :bandwidth_limit_bytes)
      add_column :mobile_proxies, :bandwidth_limit_bytes, :bigint
    end
    unless column_exists?(:mobile_proxies, :bandwidth_used_bytes)
      add_column :mobile_proxies, :bandwidth_used_bytes, :bigint, default: 0
    end

    unless index_exists?(:mobile_proxies, :localtonet_tunnel_id)
      add_index :mobile_proxies, :localtonet_tunnel_id
    end

    return if index_exists?(:mobile_proxies, :proxy_source)

    add_index :mobile_proxies, :proxy_source, name: 'index_mobile_proxies_on_proxy_source'
  end
end

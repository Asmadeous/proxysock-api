class AddExpiresAtToResources < ActiveRecord::Migration[8.1]
  def change
    # Standardize expiry tracking across all provisioned resources
    add_column :vms, :expires_at, :datetime
    add_column :mobile_proxies, :expires_at, :datetime
    add_column :static_datacenter_proxies, :expires_at, :datetime
    add_column :static_isp_proxies, :expires_at, :datetime
    add_column :residential_rotating_proxies, :expires_at, :datetime
    add_column :esim_orders, :expires_at, :datetime
    add_column :vpn_accounts, :expires_at, :datetime
    
    # Optional: Backfill existing records (e.g. set expiry to 30 days from created_at)
    # reversible do |dir|
    #   dir.up do
    #     execute "UPDATE vms SET expires_at = created_at + INTERVAL '30 days'"
    #     ...
    #   end
    # end
  end
end

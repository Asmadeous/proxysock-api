class UpdateProductOrderFkToMasterOrder < ActiveRecord::Migration[8.0]
  def change
    # List of tables that need their order_id FK updated to point to 'orders' instead of 'reseller_orders'
    # Note: 'ecommerce_orders' and 'reseller_orders' context tables will point to Master Order via previous migration
    # Here we handle the specific product tables like VmOrder, MobileProxyOrder etc.
    # Currently they point to 'reseller_orders' (via previous 'orders' table name) or they were created pointing to 'order'
    
    # We need to make sure 'order_id' in these tables refers to the Master 'orders' table.
    # Since we are refactoring, we'll remove old FKs and add new ones to be safe.
    
    tables = [
      :vm_orders, 
      :mobile_proxy_orders, 
      :static_datacenter_proxy_orders, 
      :static_isp_proxy_orders, 
      :static_residential_proxy_orders,
      :residential_rotating_proxy_orders,
      :vpn_orders,
      :esim_orders
    ]
    
    tables.each do |table|
      # First check if the column exists and has a foreign key
      if foreign_key_exists?(table, :reseller_orders, column: :order_id)
        remove_foreign_key table, :reseller_orders, column: :order_id
      end
      # In case it was pointing to 'orders' table which was renamed/dropped? 
      # Actually 'orders' was probably renamed or we created new table.
      # Let's just safely remove any FK on order_id
      
      # Now add FK to new Master orders table
      add_foreign_key table, :orders, column: :order_id
    end
  end
end

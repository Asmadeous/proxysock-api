class AddProviderOrderIdToOrders < ActiveRecord::Migration[8.1]
  def change
    unless column_exists?(:orders, :provider_order_id)
      add_column :orders, :provider_order_id, :string
    end
    unless column_exists?(:orders, :quantity)
      add_column :orders, :quantity, :integer, default: 1
    end
    
    unless index_exists?(:orders, :provider_order_id)
      add_index :orders, :provider_order_id
    end
  end
end

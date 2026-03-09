class AddOwnedProxyFieldsToOrders < ActiveRecord::Migration[8.1]
  def change
    add_column :orders, :credentials, :jsonb, default: [] unless column_exists?(:orders, :credentials)
  end
end

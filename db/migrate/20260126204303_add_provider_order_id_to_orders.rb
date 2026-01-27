# frozen_string_literal: true

class AddProviderOrderIdToOrders < ActiveRecord::Migration[8.1]
  def change
    add_column :orders, :provider_order_id, :string unless column_exists?(:orders, :provider_order_id)
    add_column :orders, :quantity, :integer, default: 1 unless column_exists?(:orders, :quantity)

    return if index_exists?(:orders, :provider_order_id)

    add_index :orders, :provider_order_id
  end
end

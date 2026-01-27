# frozen_string_literal: true

class AddApiResponseToEsimOrders < ActiveRecord::Migration[8.1]
  def change
    add_column :esim_orders, :api_response, :jsonb, default: {} unless column_exists?(:esim_orders, :api_response)
    add_column :esim_orders, :provider_order_no, :string unless column_exists?(:esim_orders, :provider_order_no)
    add_column :esim_orders, :esim_provider, :string unless column_exists?(:esim_orders, :esim_provider)

    return if index_exists?(:esim_orders, :provider_order_no)

    add_index :esim_orders, :provider_order_no
  end
end

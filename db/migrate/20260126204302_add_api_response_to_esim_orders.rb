class AddApiResponseToEsimOrders < ActiveRecord::Migration[8.1]
  def change
    unless column_exists?(:esim_orders, :api_response)
      add_column :esim_orders, :api_response, :jsonb, default: {}
    end
    unless column_exists?(:esim_orders, :provider_order_no)
      add_column :esim_orders, :provider_order_no, :string
    end
    unless column_exists?(:esim_orders, :esim_provider)
      add_column :esim_orders, :esim_provider, :string
    end
    
    unless index_exists?(:esim_orders, :provider_order_no)
      add_index :esim_orders, :provider_order_no
    end
  end
end

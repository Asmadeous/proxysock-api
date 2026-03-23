# frozen_string_literal: true

class AddMyproxyapiOrderIdToMobileProxyOrders < ActiveRecord::Migration[8.1]
  def change
    add_column :mobile_proxy_orders, :myproxyapi_order_id, :string
  end
end

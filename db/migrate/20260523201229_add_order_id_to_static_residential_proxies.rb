# frozen_string_literal: true

class AddOrderIdToStaticResidentialProxies < ActiveRecord::Migration[7.1]
  def change
    add_column :static_residential_proxies, :order_id, :uuid

    add_index :static_residential_proxies, :order_id

    add_foreign_key :static_residential_proxies, :orders
  end
end

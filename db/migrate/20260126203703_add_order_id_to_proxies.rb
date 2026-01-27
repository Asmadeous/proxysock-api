# frozen_string_literal: true

class AddOrderIdToProxies < ActiveRecord::Migration[8.1]
  def change
    # Add order_id to proxy models for assignment tracking
    unless column_exists?(:mobile_proxies, :order_id)
      add_reference :mobile_proxies, :order, foreign_key: true, null: true
    end
    unless column_exists?(:static_datacenter_proxies, :order_id)
      add_reference :static_datacenter_proxies, :order, foreign_key: true, null: true
    end
    unless column_exists?(:static_isp_proxies, :order_id)
      add_reference :static_isp_proxies, :order, foreign_key: true, null: true
    end
    return if column_exists?(:residential_rotating_proxies, :order_id)

    add_reference :residential_rotating_proxies, :order, foreign_key: true, null: true
  end
end

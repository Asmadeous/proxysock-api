# frozen_string_literal: true

class RefactorResellerOrdersForContext < ActiveRecord::Migration[8.0]
  def change
    # Remove columns moved to Master Order
    remove_column :reseller_orders, :order_number, :string
    remove_column :reseller_orders, :status, :string
    remove_column :reseller_orders, :total_amount, :decimal
    remove_column :reseller_orders, :currency, :string
    remove_column :reseller_orders, :expires_at, :datetime
    remove_column :reseller_orders, :provider_order_id, :string
    remove_column :reseller_orders, :metadata, :jsonb
    remove_reference :reseller_orders, :product, foreign_key: true
    remove_reference :reseller_orders, :product_pricing, foreign_key: true

    # Add reference to Master Order
    add_reference :reseller_orders, :order, null: false, foreign_key: true

    # Add custom fields for context if needed
    add_column :reseller_orders, :custom_fields, :jsonb
  end
end

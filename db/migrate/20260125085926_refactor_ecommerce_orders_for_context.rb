class RefactorEcommerceOrdersForContext < ActiveRecord::Migration[8.0]
  def change
    # Remove columns moved to Master Order
    remove_column :ecommerce_orders, :order_number, :string
    remove_column :ecommerce_orders, :status, :string
    remove_column :ecommerce_orders, :subtotal, :decimal
    remove_column :ecommerce_orders, :tax, :decimal
    remove_column :ecommerce_orders, :total, :decimal
    remove_column :ecommerce_orders, :currency, :string
    remove_column :ecommerce_orders, :payment_method, :string
    remove_column :ecommerce_orders, :paid_at, :datetime
    remove_column :ecommerce_orders, :fulfilled_at, :datetime
    remove_column :ecommerce_orders, :cancelled_at, :datetime
    remove_column :ecommerce_orders, :refunded_at, :datetime
    remove_column :ecommerce_orders, :metadata, :jsonb

    # Add reference to Master Order
    add_reference :ecommerce_orders, :order, null: false, foreign_key: true
    
    # Add polymorphic orderable (VmOrder, ProxyOrder, etc)
    add_reference :ecommerce_orders, :orderable, polymorphic: true, null: false

    # Add custom fields for context
    add_column :ecommerce_orders, :custom_fields, :jsonb
  end
end

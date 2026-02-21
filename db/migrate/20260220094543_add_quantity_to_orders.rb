# frozen_string_literal: true

class AddQuantityToOrders < ActiveRecord::Migration[8.1]
  def change
    add_column :orders, :quantity, :integer, default: 1, null: false unless column_exists?(:orders, :quantity)
  end
end

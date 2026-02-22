# frozen_string_literal: true

class AddEsimTypeAndMoqQuantityToEsimOrders < ActiveRecord::Migration[8.1]
  def change
    add_column :esim_orders, :esim_type,    :string,  default: 'data_only', null: false
    add_column :esim_orders, :moq_quantity, :integer, default: 1,           null: false
  end
end

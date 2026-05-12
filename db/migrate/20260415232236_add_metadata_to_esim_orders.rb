# frozen_string_literal: true

class AddMetadataToEsimOrders < ActiveRecord::Migration[7.1]
  def change
    add_column :esim_orders, :metadata, :jsonb, default: {}
  end
end

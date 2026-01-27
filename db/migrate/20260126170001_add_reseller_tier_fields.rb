# frozen_string_literal: true

class AddResellerTierFields < ActiveRecord::Migration[8.1]
  def change
    unless column_exists?(:resellers, :reseller_type)
      add_column :resellers, :reseller_type, :string, default: 'api_only'
    end
    unless column_exists?(:resellers, :infrastructure_surcharge_percentage)
      add_column :resellers, :infrastructure_surcharge_percentage, :decimal, precision: 5, scale: 2, default: 0.0
    end

    return if index_exists?(:resellers, :reseller_type)

    add_index :resellers, :reseller_type
  end
end

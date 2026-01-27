# frozen_string_literal: true

class AddProductTypeToProducts < ActiveRecord::Migration[8.1]
  def change
    unless column_exists?(:products, :product_type)
      add_column :products, :product_type, :string, null: false, default: 'proxy'
    end
    add_column :products, :provider_type, :string unless column_exists?(:products, :provider_type)
    add_column :products, :metadata, :jsonb, default: {} unless column_exists?(:products, :metadata)

    add_index :products, :product_type unless index_exists?(:products, :product_type)
    return if index_exists?(:products, :provider_type)

    add_index :products, :provider_type
  end
end

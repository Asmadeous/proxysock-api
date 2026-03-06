# frozen_string_literal: true

class UpdateWalletsAndPricingsForEarnings < ActiveRecord::Migration[8.1]
  def change
    # Wallets multi-type support
    add_column :wallets, :wallet_type, :string, default: 'main', null: false
    add_index :wallets, %i[owner_id owner_type wallet_type], name: 'index_wallets_on_owner_and_type'

    # Enhanced pricing margins
    add_column :product_pricings, :api_price, :decimal, precision: 15, scale: 4
    add_column :product_pricings, :reseller_selling_price, :decimal, precision: 15, scale: 4
    add_column :product_pricings, :user_selling_price, :decimal, precision: 15, scale: 4

    # Indexing for Products CRUD
    add_index :products, :name unless index_exists?(:products, :name)
    add_index :products, :provider unless index_exists?(:products, :provider)
    add_index :products, :product_type unless index_exists?(:products, :product_type)
    add_index :products, :active unless index_exists?(:products, :active)
  end
end

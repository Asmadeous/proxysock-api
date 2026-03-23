# frozen_string_literal: true

class AddSingleProductResellerTier < ActiveRecord::Migration[8.1]
  def change
    # Add allowed_product_category_id to resellers for single_product tier
    add_column :resellers, :allowed_product_category_id, :uuid, null: true
    add_foreign_key :resellers, :product_categories, column: :allowed_product_category_id
    add_index :resellers, :allowed_product_category_id

    # Add owner_type to users to distinguish platform users from reseller-managed users
    add_column :users, :owner_type, :string, default: 'platform', null: false
    add_index :users, :owner_type
  end
end

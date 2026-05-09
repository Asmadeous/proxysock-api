class AddTokenVersionToResellersAndEmployees < ActiveRecord::Migration[8.1]
  def change
    add_column :resellers, :token_version, :integer, default: 1, null: false
    add_column :employees, :token_version, :integer, default: 1, null: false
  end
end

class AddRotatingTokenFieldsToResellers < ActiveRecord::Migration[8.1]
  def change
    add_column :resellers, :current_token_jti, :string
    add_column :resellers, :token_issued_at, :datetime
    add_column :resellers, :token_request_count, :integer, default: 0
    add_index :resellers, :current_token_jti, unique: true
  end
end

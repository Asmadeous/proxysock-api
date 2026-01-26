class MakeWalletsPolymorphic < ActiveRecord::Migration[8.1]
  def up
    # Add owner columns
    unless column_exists?(:wallets, :owner_id)
      add_column :wallets, :owner_id, :bigint
    end
    unless column_exists?(:wallets, :owner_type)
      add_column :wallets, :owner_type, :string
    end
    
    # Backfill existing wallets (assuming they belong to Users)
    execute "UPDATE wallets SET owner_id = user_id, owner_type = 'User' WHERE owner_id IS NULL AND user_id IS NOT NULL"
    
    # Add index
    unless index_exists?(:wallets, [:owner_type, :owner_id])
      add_index :wallets, [:owner_type, :owner_id]
    end
    
    # Allow null user_id
    change_column_null :wallets, :user_id, true
  end

  def down
    remove_index :wallets, [:owner_type, :owner_id] if index_exists?(:wallets, [:owner_type, :owner_id])
    remove_column :wallets, :owner_type if column_exists?(:wallets, :owner_type)
    remove_column :wallets, :owner_id if column_exists?(:wallets, :owner_id)
  end
end

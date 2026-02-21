class AddLastSeenAtToAccounts < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :last_seen_at, :datetime
    add_column :employees, :last_seen_at, :datetime
    add_column :resellers, :last_seen_at, :datetime
  end
end

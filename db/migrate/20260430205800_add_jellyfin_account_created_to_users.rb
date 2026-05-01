class AddJellyfinAccountCreatedToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :jellyfin_account_created, :boolean, default: false
  end
end

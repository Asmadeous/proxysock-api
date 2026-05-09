class AddJellyfinCredentialsToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :jellyfin_username, :string
    add_column :users, :jellyfin_password, :string
  end
end

class AddProfilePictureUrlToUsersAndEmployees < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :profile_picture_url, :string
    add_column :employees, :profile_picture_url, :string
  end
end

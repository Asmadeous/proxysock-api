class AddMyproxyapiFieldsToUsersAndResellers < ActiveRecord::Migration[7.1]
  def change
    add_column :resellers, :country_code, :string
    add_column :resellers, :country, :string
    add_column :resellers, :city, :string
    add_column :resellers, :myproxyapi_user_id, :string
    add_column :resellers, :myproxyapi_country_id, :integer

    add_column :users, :country_code, :string
    add_column :users, :myproxyapi_user_id, :string
    add_column :users, :myproxyapi_country_id, :integer
  end
end

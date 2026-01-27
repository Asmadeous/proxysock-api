# frozen_string_literal: true

class AddSshCredentialsToVms < ActiveRecord::Migration[8.1]
  def change
    add_column :vms, :ssh_username, :string unless column_exists?(:vms, :ssh_username)
    add_column :vms, :ssh_password, :string unless column_exists?(:vms, :ssh_password)
    add_column :vms, :root_password, :string unless column_exists?(:vms, :root_password)
    return if column_exists?(:vms, :api_response)

    add_column :vms, :api_response, :jsonb, default: {}
  end
end

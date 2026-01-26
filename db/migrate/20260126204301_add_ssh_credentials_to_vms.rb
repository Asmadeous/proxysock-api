class AddSshCredentialsToVms < ActiveRecord::Migration[8.1]
  def change
    unless column_exists?(:vms, :ssh_username)
      add_column :vms, :ssh_username, :string
    end
    unless column_exists?(:vms, :ssh_password)
      add_column :vms, :ssh_password, :string
    end
    unless column_exists?(:vms, :root_password)
      add_column :vms, :root_password, :string
    end
    unless column_exists?(:vms, :api_response)
      add_column :vms, :api_response, :jsonb, default: {}
    end
  end
end

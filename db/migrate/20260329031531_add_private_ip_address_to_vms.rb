# frozen_string_literal: true

class AddPrivateIpAddressToVms < ActiveRecord::Migration[8.1]
  def change
    add_column :vms, :private_ip_address, :string, comment: 'Private IP on vmbr1 for Windows VMs'
    add_index :vms, :private_ip_address, unique: true
  end
end

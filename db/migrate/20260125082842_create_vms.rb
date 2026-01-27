# frozen_string_literal: true

class CreateVms < ActiveRecord::Migration[8.1]
  def change
    create_table :vms do |t|
      t.references :vm_order, null: false, foreign_key: true
      t.string :proxmox_vm_id
      t.string :proxmox_node
      t.string :vm_type
      t.string :country_code
      t.string :ip_address
      t.integer :ssh_port
      t.string :ssh_username
      t.string :ssh_password_encrypted
      t.integer :rdp_port
      t.string :rdp_username
      t.string :rdp_password_encrypted
      t.string :status
      t.integer :ansible_playbook_run_id
      t.jsonb :metadata

      t.timestamps
    end
  end
end

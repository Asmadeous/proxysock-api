# frozen_string_literal: true

class CreateProxmoxOperations < ActiveRecord::Migration[8.1]
  def change
    create_table :proxmox_operations do |t|
      t.references :vm, null: false, foreign_key: true
      t.string :operation_type
      t.string :proxmox_node
      t.string :proxmox_vm_id
      t.jsonb :request_params
      t.jsonb :response_data
      t.string :status
      t.string :error_message

      t.timestamps
    end
  end
end

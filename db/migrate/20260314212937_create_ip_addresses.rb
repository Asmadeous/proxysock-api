# frozen_string_literal: true

class CreateIpAddresses < ActiveRecord::Migration[8.1]
  def change
    create_table :ip_addresses, id: :uuid do |t|
      t.string :address
      t.string :status
      t.uuid :vm_id
      t.datetime :assigned_at

      t.timestamps
    end
    add_index :ip_addresses, :vm_id
  end
end

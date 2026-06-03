# frozen_string_literal: true

class CreateResourceAlerts < ActiveRecord::Migration[8.1]
  def change
    create_table :resource_alerts, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.string :resource_type, null: false  # 'proxmox_server', 'vm', 'container'
      t.string :resource_id               # proxmox_vm_id, container name, or 'pve'
      t.string :metric, null: false        # 'cpu', 'memory', 'disk', 'storage'
      t.float :value, null: false          # Current percentage at time of alert
      t.float :threshold, null: false, default: 90.0
      t.string :status, default: 'firing', null: false  # 'firing', 'resolved'
      t.string :recipient_email
      t.string :recipient_type             # 'admin', 'user', 'reseller'
      t.uuid :recipient_id
      t.string :resource_name              # hostname, container name, or storage name
      t.datetime :resolved_at
      t.datetime :notified_at

      t.timestamps
    end

    add_index :resource_alerts, :status
    add_index :resource_alerts, :resource_type
    add_index :resource_alerts, %i[resource_type resource_id metric status],
              name: 'idx_resource_alerts_unique_firing',
              where: "status = 'firing'"
  end
end

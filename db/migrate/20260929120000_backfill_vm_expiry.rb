# frozen_string_literal: true

# VMs provisioned before VmProvisioningJob recorded an expiry never expired. Give each active
# one the expiry it was bought with: created plus the order's paid days (30 when unset).
# ExpirationCleanupJob then expires and stops the ones already past it.
class BackfillVmExpiry < ActiveRecord::Migration[8.1]
  def up
    execute <<~SQL.squish
      UPDATE vms
      SET expires_at = vms.created_at + make_interval(days =>
        CASE WHEN orders.metadata->>'duration_days' ~ '^[1-9][0-9]*$'
             THEN (orders.metadata->>'duration_days')::int ELSE 30 END)
      FROM vm_orders
      JOIN orders ON orders.id = vm_orders.order_id
      WHERE vms.vm_order_id = vm_orders.id AND vms.status = 'active' AND vms.expires_at IS NULL
    SQL

    execute <<~SQL.squish
      UPDATE vms SET expires_at = vms.created_at + interval '30 days'
      WHERE vms.status = 'active' AND vms.expires_at IS NULL
    SQL
  end

  # Nothing to undo: an expiry is what these VMs should always have had.
  def down; end
end

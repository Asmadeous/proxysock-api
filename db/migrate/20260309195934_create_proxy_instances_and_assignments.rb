# frozen_string_literal: true

class CreateProxyInstancesAndAssignments < ActiveRecord::Migration[8.1]
  def change
    create_table :proxy_instances, id: :uuid do |t|
      t.string :proxy_address, null: false
      t.string :device_type
      t.string :status, default: 'available'
      t.decimal :health_score, default: 1.0
      t.decimal :success_rate, default: 1.0
      t.jsonb :metadata, default: {}
      t.datetime :last_health_check
      t.timestamps
    end
    add_index :proxy_instances, :proxy_address, unique: true
    add_index :proxy_instances, :status

    create_table :proxy_assignments, id: :uuid do |t|
      t.references :order, type: :uuid, null: false, foreign_key: true
      t.uuid :user_id # Link to auth user
      t.references :proxy_instance, type: :uuid, null: false, foreign_key: true
      t.string :username, null: false
      t.string :password, null: false
      t.string :status, default: 'active'
      t.datetime :expires_at
      t.decimal :gb_limit
      t.decimal :gb_used, default: 0.0
      t.boolean :is_owned_proxy, default: true
      t.uuid :owned_proxy_billing_plan_id
      t.timestamps
    end
    add_index :proxy_assignments, :status
    add_index :proxy_assignments, :expires_at
    add_index :proxy_assignments, :user_id
  end
end

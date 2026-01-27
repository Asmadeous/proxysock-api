# frozen_string_literal: true

class CreateAuditLogs < ActiveRecord::Migration[8.0]
  def change
    create_table :audit_logs do |t|
      t.references :auditable, polymorphic: true, null: false
      t.string :action
      t.jsonb :object_changes
      t.string :user_type
      t.bigint :user_id
      t.string :ip_address

      t.timestamps
    end
  end
end

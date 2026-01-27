# frozen_string_literal: true

class CreateAdminActionLogs < ActiveRecord::Migration[8.0]
  def change
    create_table :admin_action_logs do |t|
      t.references :employee, null: false, foreign_key: true
      t.string :action_type
      t.references :target, polymorphic: true, null: false
      t.jsonb :object_changes
      t.string :ip_address
      t.string :user_agent

      t.timestamps
    end
  end
end

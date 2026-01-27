# frozen_string_literal: true

class CreateUserImpersonationLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :user_impersonation_logs do |t|
      t.references :employee, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.datetime :started_at
      t.datetime :ended_at
      t.string :ip_address
      t.string :reason

      t.timestamps
    end
  end
end

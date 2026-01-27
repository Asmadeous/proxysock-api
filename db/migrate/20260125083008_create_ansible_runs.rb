# frozen_string_literal: true

class CreateAnsibleRuns < ActiveRecord::Migration[8.1]
  def change
    create_table :ansible_runs do |t|
      t.references :vm, null: false, foreign_key: true
      t.string :playbook_name
      t.jsonb :playbook_tags
      t.jsonb :inventory
      t.jsonb :extra_vars
      t.string :status
      t.text :stdout
      t.text :stderr
      t.integer :exit_code
      t.datetime :started_at
      t.datetime :completed_at

      t.timestamps
    end
  end
end

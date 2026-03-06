# frozen_string_literal: true

class CreateNotifications < ActiveRecord::Migration[8.1]
  def change
    create_table :notifications do |t|
      t.references :recipient, polymorphic: true, null: false
      t.string :category
      t.string :title
      t.text :message
      t.jsonb :metadata
      t.datetime :read_at

      t.timestamps
    end
  end
end

# frozen_string_literal: true

class CreateSupportChats < ActiveRecord::Migration[8.1]
  def change
    create_table :support_chats do |t|
      t.references :chatable, polymorphic: true, null: false
      t.references :assigned_to, null: true, foreign_key: { to_table: :employees }
      t.string :status, default: 'open'
      t.string :subject
      t.string :session_token, null: false

      t.timestamps
    end
    add_index :support_chats, :session_token
  end
end

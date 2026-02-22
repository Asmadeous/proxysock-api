# frozen_string_literal: true

class CreateGuestChats < ActiveRecord::Migration[7.1]
  def change
    create_table :guest_chats do |t|
      t.string :guest_name, null: false
      t.string :guest_email, null: false
      t.string :subject
      t.string :status, null: false, default: 'open'
      t.string :session_token, null: false
      t.references :assigned_to, foreign_key: { to_table: :employees }, null: true

      t.timestamps
    end

    add_index :guest_chats, :session_token, unique: true
    add_index :guest_chats, :status

    create_table :guest_chat_messages do |t|
      t.references :guest_chat, null: false, foreign_key: true
      t.string :sender_type, null: false # 'guest' or 'employee'
      t.bigint :sender_id # employee ID if sender_type == 'employee'
      t.text :body, null: false

      t.timestamps
    end

    add_index :guest_chat_messages, :created_at
  end
end

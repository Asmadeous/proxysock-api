# frozen_string_literal: true

class CreateTicketsAndMessages < ActiveRecord::Migration[8.1]
  def change
    create_table :tickets do |t|
      t.references :user, polymorphic: true, null: false # User or Reseller
      t.references :assigned_to, foreign_key: { to_table: :employees }
      t.references :order, foreign_key: true, null: true # Context
      t.string :subject, null: false
      t.string :status, default: 'open', null: false
      t.string :priority, default: 'normal'
      t.timestamps
    end

    add_index :tickets, %i[user_type user_id]
    add_index :tickets, :status

    create_table :ticket_messages do |t|
      t.references :ticket, null: false, foreign_key: true
      t.references :sender, polymorphic: true, null: false # User, Reseller, or Employee
      t.text :body, null: false
      t.boolean :internal_note, default: false
      t.jsonb :attachments, default: []
      t.timestamps
    end

    add_index :ticket_messages, %i[sender_type sender_id]
  end
end

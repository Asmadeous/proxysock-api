# frozen_string_literal: true

class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :email
      t.string :password_digest
      t.string :first_name
      t.string :last_name
      t.string :phone
      t.string :status
      t.datetime :email_verified_at
      t.datetime :last_login_at
      t.jsonb :metadata

      t.timestamps
    end
    add_index :users, :email
  end
end

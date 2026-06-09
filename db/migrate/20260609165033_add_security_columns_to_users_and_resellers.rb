# frozen_string_literal: true

class AddSecurityColumnsToUsersAndResellers < ActiveRecord::Migration[8.1]
  def change
    # Users: add account lock tracking
    change_table :users, bulk: true do |t|
      t.integer :failed_attempts, default: 0, null: false
      t.string :unlock_token
      t.datetime :locked_at
    end
    add_index :users, :unlock_token, unique: true

    # Resellers: add email verification, password reset, and account lock
    change_table :resellers, bulk: true do |t|
      t.string :email_confirmation_token
      t.datetime :email_verified_at
      t.string :password_reset_token
      t.datetime :password_reset_sent_at
      t.integer :failed_attempts, default: 0, null: false
      t.string :unlock_token
      t.datetime :locked_at
    end
    add_index :resellers, :email_confirmation_token, unique: true
    add_index :resellers, :unlock_token, unique: true
    add_index :resellers, :password_reset_token, unique: true
  end
end

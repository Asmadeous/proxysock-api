# frozen_string_literal: true

class CreateResellers < ActiveRecord::Migration[8.1]
  def change
    create_table :resellers do |t|
      t.string :email
      t.string :username
      t.string :password_digest
      t.string :company_name
      t.string :api_key_hash
      t.string :status
      t.decimal :discount_percentage

      t.timestamps
    end
    add_index :resellers, :email
    add_index :resellers, :username
  end
end

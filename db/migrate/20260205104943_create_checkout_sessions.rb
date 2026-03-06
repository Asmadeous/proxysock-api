# frozen_string_literal: true

class CreateCheckoutSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :checkout_sessions do |t|
      t.references :user, null: false, foreign_key: true
      t.decimal :total_amount, precision: 10, scale: 2, null: false
      t.string :currency, default: 'USD', null: false
      t.string :payment_method, null: false
      t.string :gateway_reference
      t.string :status, default: 'pending', null: false
      t.json :metadata

      t.timestamps
    end

    add_index :checkout_sessions, :gateway_reference, unique: true
    add_index :checkout_sessions, :status
  end
end

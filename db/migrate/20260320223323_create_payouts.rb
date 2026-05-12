# frozen_string_literal: true

class CreatePayouts < ActiveRecord::Migration[8.1]
  def change
    create_table :payouts, id: :uuid, default: -> { 'gen_random_uuid()' } do |t|
      t.uuid :reseller_id, null: false
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.string :gateway, null: false
      t.string :status, default: 'pending', null: false
      t.jsonb :payment_details, default: {}
      t.jsonb :gateway_response, default: {}
      t.string :reference
      t.datetime :completed_at

      t.timestamps
    end

    add_foreign_key :payouts, :resellers
    add_index :payouts, :reseller_id
    add_index :payouts, :status
    add_index :payouts, :reference, unique: true
  end
end

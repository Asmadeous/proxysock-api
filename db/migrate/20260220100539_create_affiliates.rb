# frozen_string_literal: true

class CreateAffiliates < ActiveRecord::Migration[8.1]
  def change
    create_table :affiliates do |t|
      t.references :affiliatable, polymorphic: true, null: false, index: true
      t.string  :referral_code,   null: false
      t.string  :status,          null: false, default: 'active'
      t.decimal :commission_rate, precision: 5, scale: 2, null: false, default: 10.0
      t.decimal :discount_rate,   precision: 5, scale: 2, null: false, default: 5.0
      t.decimal :total_earned,    precision: 10, scale: 2, null: false, default: 0.0
      t.decimal :total_paid_out,  precision: 10, scale: 2, null: false, default: 0.0
      t.datetime :last_payout_at
      t.text :notes
      t.timestamps
    end

    add_index :affiliates, :referral_code, unique: true
    add_index :affiliates, :status
  end
end

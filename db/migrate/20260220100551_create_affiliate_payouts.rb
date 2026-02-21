# frozen_string_literal: true

class CreateAffiliatePayouts < ActiveRecord::Migration[8.1]
  def change
    create_table :affiliate_payouts do |t|
      t.references :affiliate, null: false, foreign_key: true, index: true
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.string  :status,          null: false, default: 'pending'   # pending | processing | paid | failed
      t.string  :payment_method                                       # wallet | bank_transfer | crypto
      t.jsonb   :payment_details, default: {}                        # bank/wallet details
      t.datetime :paid_at
      t.text :notes
      t.timestamps
    end

    add_index :affiliate_payouts, :status
  end
end

# frozen_string_literal: true

class CreateAffiliateReferrals < ActiveRecord::Migration[8.1]
  def change
    create_table :affiliate_referrals do |t|
      t.references :affiliate, null: false, foreign_key: true, index: true
      t.references :referred,  polymorphic: true, null: false, index: true   # User or Reseller
      t.references :order,     foreign_key: true, null: true, index: true    # first converting order
      t.string  :status,                  null: false, default: 'pending'    # pending | converted | rejected
      t.decimal :referee_discount_applied, precision: 5, scale: 2
      t.decimal :commission_amount,        precision: 10, scale: 2
      t.datetime :converted_at
      t.timestamps
    end

    add_index :affiliate_referrals, :status
  end
end

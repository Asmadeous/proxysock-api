# frozen_string_literal: true

class CreateBillingHistories < ActiveRecord::Migration[8.1]
  def change
    create_table :billing_histories do |t|
      t.references :reseller, null: false, foreign_key: true
      t.date :billing_period_start
      t.date :billing_period_end
      t.integer :total_orders
      t.decimal :total_revenue
      t.decimal :total_refunds
      t.decimal :net_revenue
      t.string :currency
      t.datetime :generated_at

      t.timestamps
    end
  end
end

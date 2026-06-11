class CreateOrderFundSplits < ActiveRecord::Migration[8.1]
  def change
    create_table :order_fund_splits, id: :uuid do |t|
      t.references :order, null: false, foreign_key: true, type: :uuid
      t.decimal :total_amount, precision: 10, scale: 2, null: false
      t.decimal :capital_amount, precision: 10, scale: 2, null: false
      t.decimal :profit_amount, precision: 10, scale: 2, null: false
      t.string :status, default: 'pending', null: false
      t.string :payout_transaction_id
      t.datetime :paid_out_at

      t.timestamps
    end
  end
end

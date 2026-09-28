# frozen_string_literal: true

# Top-ups for MeiSIM phone-number lines. Customers pay from their balance; staff apply
# the credit by hand in the MeiSIM portal and mark the top-up done in the admin panel.
class CreateEsimTopups < ActiveRecord::Migration[8.1]
  def change
    create_table :esim_topup_subscriptions, id: :uuid do |t|
      t.references :order, type: :uuid, null: false, foreign_key: true
      t.references :orderable, type: :uuid, polymorphic: true, null: false
      t.decimal :topup_value, precision: 10, scale: 2, null: false
      t.decimal :price, precision: 10, scale: 2, null: false
      t.string :status, null: false, default: 'active'
      t.datetime :next_charge_at, null: false
      t.datetime :last_charged_at
      t.datetime :cancelled_at
      t.timestamps
    end
    add_index :esim_topup_subscriptions, %i[status next_charge_at]
    add_index :esim_topup_subscriptions, :order_id, unique: true, where: "status <> 'cancelled'",
                                                    name: 'index_esim_topup_subscriptions_one_live_per_order'

    create_table :esim_topups, id: :uuid do |t|
      t.references :order, type: :uuid, null: false, foreign_key: true
      t.references :orderable, type: :uuid, polymorphic: true, null: false
      t.references :esim_topup_subscription, type: :uuid, foreign_key: true
      t.references :charge_transaction, type: :uuid, foreign_key: { to_table: :transactions }
      t.decimal :topup_value, precision: 10, scale: 2, null: false
      t.decimal :price, precision: 10, scale: 2, null: false
      t.string :status, null: false, default: 'pending'
      t.string :reference, null: false
      t.text :admin_note
      t.datetime :completed_at
      t.datetime :cancelled_at
      t.timestamps
    end
    add_index :esim_topups, :status
    add_index :esim_topups, :reference, unique: true
  end
end

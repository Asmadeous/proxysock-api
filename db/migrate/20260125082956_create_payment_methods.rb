class CreatePaymentMethods < ActiveRecord::Migration[8.1]
  def change
    create_table :payment_methods do |t|
      t.references :owner, polymorphic: true, null: false
      t.string :gateway
      t.string :gateway_customer_id
      t.string :gateway_payment_method_id
      t.string :card_type
      t.string :last4
      t.integer :exp_month
      t.integer :exp_year
      t.boolean :is_default
      t.boolean :active

      t.timestamps
    end
  end
end

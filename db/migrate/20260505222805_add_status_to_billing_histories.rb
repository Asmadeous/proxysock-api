# frozen_string_literal: true

class AddStatusToBillingHistories < ActiveRecord::Migration[8.1]
  def change
    add_column :billing_histories, :status, :string
    add_column :billing_histories, :amount_due, :decimal
    add_column :billing_histories, :amount_paid, :decimal
  end
end

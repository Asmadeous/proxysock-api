# frozen_string_literal: true

class AddCheckoutSessionToOrders < ActiveRecord::Migration[8.1]
  def change
    add_reference :orders, :checkout_session, null: true, foreign_key: true
  end
end

# frozen_string_literal: true

class ChangeDepositIdNullableOnTickets < ActiveRecord::Migration[8.0]
  def change
    change_column_null :tickets, :deposit_id, true
  end
end

class AddDepositToTickets < ActiveRecord::Migration[8.1]
  def change
    add_reference :tickets, :deposit, null: false, foreign_key: true, type: :uuid
  end
end

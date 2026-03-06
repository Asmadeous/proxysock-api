# frozen_string_literal: true

class AddResellerIdToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :reseller_id, :uuid
    add_index :users, :reseller_id
  end
end

# frozen_string_literal: true

class AddReferredByCodeToUsersAndResellers < ActiveRecord::Migration[8.1]
  def change
    add_column :users,     :referred_by_code, :string
    add_column :resellers, :referred_by_code, :string

    add_index :users,     :referred_by_code
    add_index :resellers, :referred_by_code
  end
end

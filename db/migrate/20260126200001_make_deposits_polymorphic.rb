# frozen_string_literal: true

class MakeDepositsPolymorphic < ActiveRecord::Migration[8.1]
  def change
    add_column :deposits, :depositable_id, :bigint unless column_exists?(:deposits, :depositable_id)
    add_column :deposits, :depositable_type, :string unless column_exists?(:deposits, :depositable_type)

    # Backfill existing deposits
    reversible do |dir|
      dir.up do
        execute "UPDATE deposits SET depositable_id = user_id, depositable_type = 'User' WHERE depositable_id IS NULL AND user_id IS NOT NULL"
      end
    end

    change_column_null :deposits, :user_id, true

    return if index_exists?(:deposits, %i[depositable_type depositable_id])

    add_index :deposits, %i[depositable_type depositable_id]
  end
end

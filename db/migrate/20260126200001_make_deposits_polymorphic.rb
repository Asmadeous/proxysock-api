class MakeDepositsPolymorphic < ActiveRecord::Migration[8.1]
  def change
    unless column_exists?(:deposits, :depositable_id)
      add_column :deposits, :depositable_id, :bigint
    end
    unless column_exists?(:deposits, :depositable_type)
      add_column :deposits, :depositable_type, :string
    end

    # Backfill existing deposits
    reversible do |dir|
      dir.up do
        execute "UPDATE deposits SET depositable_id = user_id, depositable_type = 'User' WHERE depositable_id IS NULL AND user_id IS NOT NULL"
      end
    end

    change_column_null :deposits, :user_id, true
    
    unless index_exists?(:deposits, [:depositable_type, :depositable_id])
      add_index :deposits, [:depositable_type, :depositable_id]
    end
  end
end

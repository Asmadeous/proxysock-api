class MakeCartsPolymorphic < ActiveRecord::Migration[8.1]
  def change
    add_reference :carts, :orderable, polymorphic: true, type: :uuid, index: true

    reversible do |dir|
      dir.up do
        execute "UPDATE carts SET orderable_id = user_id, orderable_type = 'User' WHERE user_id IS NOT NULL"
      end
    end

    remove_column :carts, :user_id, :uuid
  end
end

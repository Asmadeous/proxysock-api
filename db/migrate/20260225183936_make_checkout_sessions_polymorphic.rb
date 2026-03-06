# frozen_string_literal: true

class MakeCheckoutSessionsPolymorphic < ActiveRecord::Migration[8.1]
  def change
    add_reference :checkout_sessions, :orderable, polymorphic: true, type: :uuid, index: true

    reversible do |dir|
      dir.up do
        execute "UPDATE checkout_sessions SET orderable_id = user_id, orderable_type = 'User' WHERE user_id IS NOT NULL"
      end
    end

    remove_column :checkout_sessions, :user_id, :uuid
  end
end

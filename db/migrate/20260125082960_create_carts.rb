class CreateCarts < ActiveRecord::Migration[8.1]
  def change
    create_table :carts do |t|
      t.references :user, null: false, foreign_key: true
      t.string :session_id
      t.string :status
      t.datetime :abandoned_at
      t.datetime :recovery_email_sent_at
      t.datetime :converted_at

      t.timestamps
    end
  end
end

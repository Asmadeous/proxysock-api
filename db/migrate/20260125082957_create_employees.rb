class CreateEmployees < ActiveRecord::Migration[8.1]
  def change
    create_table :employees do |t|
      t.string :email
      t.string :password_digest
      t.string :first_name
      t.string :last_name
      t.string :role
      t.references :department, null: false, foreign_key: true
      t.boolean :active
      t.datetime :last_login_at

      t.timestamps
    end
    add_index :employees, :email
  end
end

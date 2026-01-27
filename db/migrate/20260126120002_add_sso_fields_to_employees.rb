# frozen_string_literal: true

class AddSsoFieldsToEmployees < ActiveRecord::Migration[8.1]
  def change
    add_column :employees, :provider, :string
    add_column :employees, :uid, :string
    add_column :employees, :work_email, :string
    add_index :employees, %i[provider uid], unique: true, where: 'provider IS NOT NULL'
    add_index :employees, :work_email, unique: true
  end
end

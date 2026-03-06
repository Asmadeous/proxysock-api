# frozen_string_literal: true

class AddLocationAndIpToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :country, :string
    add_column :users, :city, :string
    add_column :users, :ip_address, :string
  end
end

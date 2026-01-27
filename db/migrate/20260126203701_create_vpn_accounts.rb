# frozen_string_literal: true

class CreateVpnAccounts < ActiveRecord::Migration[8.1]
  def change
    return if table_exists?(:vpn_accounts)

    create_table :vpn_accounts do |t|
      t.references :order, null: false, foreign_key: true
      t.string :username, null: false
      t.string :password, null: false
      t.string :server, null: false
      t.string :protocol, default: 'wireguard'
      t.string :status, default: 'pending'
      t.timestamps
    end

    add_index :vpn_accounts, :username, unique: true
  end
end

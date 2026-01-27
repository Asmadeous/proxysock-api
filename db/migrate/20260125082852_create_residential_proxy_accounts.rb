# frozen_string_literal: true

class CreateResidentialProxyAccounts < ActiveRecord::Migration[8.1]
  def change
    create_table :residential_proxy_accounts do |t|
      t.references :residential_rotating_proxy, null: false, foreign_key: true
      t.string :myproxyapi_proxy_username_id
      t.string :proxy_username
      t.string :proxy_password
      t.decimal :traffic_limit_gb
      t.decimal :traffic_used_gb
      t.string :status

      t.timestamps
    end
  end
end

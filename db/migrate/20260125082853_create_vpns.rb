# frozen_string_literal: true

class CreateVpns < ActiveRecord::Migration[8.1]
  def change
    create_table :vpns do |t|
      t.references :vpn_order, null: false, foreign_key: true
      t.string :myproxyapi_order_id
      t.string :country_code
      t.string :vpn_username
      t.string :vpn_password
      t.string :ovpn_config_url
      t.text :ovpn_config_content
      t.string :status
      t.jsonb :metadata

      t.timestamps
    end
  end
end

# frozen_string_literal: true

class CreateWebhookEndpoints < ActiveRecord::Migration[8.1]
  def change
    create_table :webhook_endpoints do |t|
      t.references :reseller, null: false, foreign_key: true
      t.string :url, null: false
      t.string :secret, null: false
      t.boolean :active, default: true
      t.jsonb :events, default: [] # e.g. ['order.created', 'vm.provisioned']
      t.timestamps
    end

    add_index :webhook_endpoints, %i[reseller_id active]
  end
end

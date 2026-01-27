# frozen_string_literal: true

class CreateWebhookEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :webhook_events do |t|
      t.references :reseller, null: false, foreign_key: true
      t.string :webhook_url
      t.string :event_type
      t.jsonb :payload
      t.string :signature
      t.integer :attempts
      t.datetime :last_attempt_at
      t.string :status
      t.integer :response_code
      t.text :response_body

      t.timestamps
    end
  end
end

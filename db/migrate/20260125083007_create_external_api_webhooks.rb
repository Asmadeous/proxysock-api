# frozen_string_literal: true

class CreateExternalApiWebhooks < ActiveRecord::Migration[8.1]
  def change
    create_table :external_api_webhooks do |t|
      t.string :provider
      t.string :webhook_type
      t.jsonb :payload
      t.string :signature
      t.boolean :signature_verified
      t.string :processing_status
      t.datetime :processed_at
      t.string :error_message
      t.references :related, polymorphic: true, null: false

      t.timestamps
    end
  end
end

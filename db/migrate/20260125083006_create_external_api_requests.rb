class CreateExternalApiRequests < ActiveRecord::Migration[8.1]
  def change
    create_table :external_api_requests do |t|
      t.string :provider
      t.string :endpoint
      t.string :http_method
      t.jsonb :request_headers
      t.jsonb :request_body
      t.integer :response_status
      t.jsonb :response_headers
      t.jsonb :response_body
      t.integer :duration_ms
      t.string :error_message
      t.references :related, polymorphic: true, null: false

      t.timestamps
    end
  end
end

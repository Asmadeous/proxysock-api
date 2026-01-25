class CreateApiTokens < ActiveRecord::Migration[8.1]
  def change
    create_table :api_tokens do |t|
      t.references :reseller, null: false, foreign_key: true
      t.string :token_name
      t.string :hashed_token
      t.datetime :last_used_at
      t.datetime :expires_at
      t.jsonb :scopes
      t.boolean :active

      t.timestamps
    end
  end
end

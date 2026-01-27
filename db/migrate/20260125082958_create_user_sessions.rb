# frozen_string_literal: true

class CreateUserSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :user_sessions do |t|
      t.references :user, null: false, foreign_key: true
      t.string :ip_address
      t.string :user_agent
      t.string :country_code
      t.string :city
      t.string :device_type
      t.string :browser
      t.string :os
      t.string :utm_source
      t.string :utm_medium
      t.string :utm_campaign
      t.string :utm_term
      t.string :utm_content
      t.string :referrer
      t.datetime :started_at
      t.datetime :last_activity_at
      t.datetime :ended_at

      t.timestamps
    end
  end
end

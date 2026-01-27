# frozen_string_literal: true

class CreateRateLimits < ActiveRecord::Migration[8.1]
  def change
    create_table :rate_limits do |t|
      t.string :identifier
      t.string :identifier_type
      t.string :endpoint
      t.integer :requests_count
      t.datetime :window_start
      t.datetime :window_end

      t.timestamps
    end
  end
end

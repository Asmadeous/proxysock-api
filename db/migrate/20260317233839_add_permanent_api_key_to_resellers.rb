# frozen_string_literal: true

class AddPermanentApiKeyToResellers < ActiveRecord::Migration[8.1]
  def change
    add_column :resellers, :permanent_api_key, :string
  end
end

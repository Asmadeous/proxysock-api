# frozen_string_literal: true

class AddSubscriptionToResellers < ActiveRecord::Migration[8.1]
  def change
    add_column :resellers, :subscription_fee, :decimal
    add_column :resellers, :subscription_expires_at, :datetime
    add_column :resellers, :dedicated_api_key, :string
  end
end

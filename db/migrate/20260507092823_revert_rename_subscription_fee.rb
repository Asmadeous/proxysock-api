# frozen_string_literal: true

class RevertRenameSubscriptionFee < ActiveRecord::Migration[8.1]
  def change
    return unless column_exists?(:resellers, :negotiated_infrastructure_cost)

    rename_column :resellers, :negotiated_infrastructure_cost, :subscription_fee
  end
end

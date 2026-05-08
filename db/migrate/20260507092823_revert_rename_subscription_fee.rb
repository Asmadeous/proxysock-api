class RevertRenameSubscriptionFee < ActiveRecord::Migration[8.1]
  def change
    if column_exists?(:resellers, :negotiated_infrastructure_cost)
      rename_column :resellers, :negotiated_infrastructure_cost, :subscription_fee
    end
  end
end

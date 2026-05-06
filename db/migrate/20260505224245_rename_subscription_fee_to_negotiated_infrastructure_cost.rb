class RenameSubscriptionFeeToNegotiatedInfrastructureCost < ActiveRecord::Migration[8.1]
  def change
    rename_column :resellers, :subscription_fee, :negotiated_infrastructure_cost
  end
end

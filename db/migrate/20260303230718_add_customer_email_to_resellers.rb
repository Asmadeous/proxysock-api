class AddCustomerEmailToResellers < ActiveRecord::Migration[8.1]
  def change
    add_column :resellers, :customer_email, :string
  end
end

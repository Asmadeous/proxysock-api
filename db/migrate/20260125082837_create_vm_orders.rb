class CreateVmOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :vm_orders do |t|
      t.references :order, null: false, foreign_key: { to_table: :reseller_orders }
      t.string :vm_type
      t.string :country_code
      t.integer :cpu_cores
      t.integer :ram_gb
      t.integer :disk_gb
      t.string :os_type
      t.string :status

      t.timestamps
    end
  end
end

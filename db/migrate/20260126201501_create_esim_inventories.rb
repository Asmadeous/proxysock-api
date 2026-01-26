class CreateEsimInventories < ActiveRecord::Migration[8.1]
  def change
    unless table_exists?(:esim_inventories)
      create_table :esim_inventories do |t|
        t.string :provider, null: false # 'lyca', 'colt'
        t.string :iccid, null: false
        t.string :activation_code
        t.string :pin1
        t.string :puk1
        t.string :pin2
        t.string :puk2
        t.string :status, default: 'available' # available, sold, reserved
        t.references :product, foreign_key: true, null: true
        t.timestamps
      end
      
      add_index :esim_inventories, :iccid, unique: true
      add_index :esim_inventories, [:provider, :status]
    end
    
    # Add new fields to esims table for inventory items
    unless column_exists?(:esims, :pin1)
      add_column :esims, :pin1, :string
    end
    unless column_exists?(:esims, :puk1)
      add_column :esims, :puk1, :string
    end
    unless column_exists?(:esims, :activation_code)
      add_column :esims, :activation_code, :string
    end
  end
end

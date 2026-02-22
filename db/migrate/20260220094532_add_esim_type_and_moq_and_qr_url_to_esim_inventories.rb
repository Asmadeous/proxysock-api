# frozen_string_literal: true

class AddEsimTypeAndMoqAndQrUrlToEsimInventories < ActiveRecord::Migration[8.1]
  def change
    add_column :esim_inventories, :esim_type,   :string,  default: 'data_only', null: false
    add_column :esim_inventories, :moq,          :integer, default: 1,           null: false
    add_column :esim_inventories, :qr_code_url,  :string

    add_index :esim_inventories, :esim_type
  end
end

# frozen_string_literal: true

class AddHostnameToVms < ActiveRecord::Migration[8.1]
  def change
    add_column :vms, :hostname, :string
    add_column :vms, :dns_name, :string
  end
end

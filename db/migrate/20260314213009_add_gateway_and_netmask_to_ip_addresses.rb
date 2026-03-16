# frozen_string_literal: true

class AddGatewayAndNetmaskToIpAddresses < ActiveRecord::Migration[8.1]
  def change
    add_column :ip_addresses, :gateway, :string
    add_column :ip_addresses, :netmask, :string
  end
end

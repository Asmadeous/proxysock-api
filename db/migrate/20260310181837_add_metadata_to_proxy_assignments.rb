# frozen_string_literal: true

class AddMetadataToProxyAssignments < ActiveRecord::Migration[8.1]
  def change
    add_column :proxy_assignments, :metadata, :jsonb
  end
end

# frozen_string_literal: true

class EnhanceAffiliatesForStandalone < ActiveRecord::Migration[8.0]
  def change
    # Make affiliatable optional so affiliates can be standalone (not tied to a User or Reseller)
    change_column_null :affiliates, :affiliatable_type, true

    # Add standalone affiliate fields
    add_column :affiliates, :name, :string
    add_column :affiliates, :email, :string
    add_column :affiliates, :payment_details, :jsonb, default: {}

    add_index :affiliates, :email, where: 'email IS NOT NULL'
  end
end

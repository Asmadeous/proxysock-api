# frozen_string_literal: true

class AddAvailableToToProducts < ActiveRecord::Migration[8.0]
  def change
    add_column :products, :available_to, :string, default: 'both'
    add_column :product_categories, :available_to, :string, default: 'both'
  end
end

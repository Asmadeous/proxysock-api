# frozen_string_literal: true

class CreateResidentialRotatingGeo < ActiveRecord::Migration[8.1]
  def change
    enable_extension 'pg_trgm' unless extension_enabled?('pg_trgm')

    create_table :rr_countries, id: :uuid do |t|
      t.string :code, null: false
      t.string :name
      t.boolean :is_main, default: false, null: false
      t.datetime :synced_at
      t.timestamps
    end
    add_index :rr_countries, :code, unique: true
    add_index :rr_countries, :is_main

    create_table :rr_states, id: :uuid do |t|
      t.string :country_code, null: false
      t.string :slug, null: false
      t.string :name
      t.timestamps
    end
    add_index :rr_states, %i[country_code slug], unique: true
    add_index :rr_states, :country_code

    # Cities are lazy-cached per state on first request (there can be very many),
    # then served from the DB.
    create_table :rr_cities, id: :uuid do |t|
      t.string :country_code, null: false
      t.string :state_slug, null: false
      t.string :slug, null: false
      t.string :name
      t.timestamps
    end
    add_index :rr_cities, %i[country_code state_slug]
    add_index :rr_cities, %i[country_code state_slug slug], unique: true

    # ~5k ISPs per country — searched by name, so add a trigram GIN index for ILIKE.
    create_table :rr_isps, id: :uuid do |t|
      t.string :country_code, null: false
      t.string :external_id
      t.string :name
      t.string :asn
      t.timestamps
    end
    add_index :rr_isps, :country_code
    add_index :rr_isps, %i[country_code external_id], unique: true
    add_index :rr_isps, :name, using: :gin, opclass: :gin_trgm_ops, name: 'index_rr_isps_on_name_trgm'
  end
end

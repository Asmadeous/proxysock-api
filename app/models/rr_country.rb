# frozen_string_literal: true

# Residential-rotating supported country (synced from MyProxyApi get-countries).
class RrCountry < ApplicationRecord
  scope :main, -> { where(is_main: true) }
  scope :alphabetical, -> { order(:name) }
end

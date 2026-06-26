# frozen_string_literal: true

class RrIsp < ApplicationRecord
  scope :for_country, ->(code) { where(country_code: code.to_s.downcase) }
  scope :alphabetical, -> { order(:name) }
  # Trigram GIN index backs this ILIKE for fast search across ~5k rows/country.
  scope :search, ->(q) { q.present? ? where('name ILIKE ?', "%#{sanitize_sql_like(q.to_s)}%") : all }
end

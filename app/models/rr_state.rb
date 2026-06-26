# frozen_string_literal: true

class RrState < ApplicationRecord
  scope :for_country, ->(code) { where(country_code: code.to_s.downcase) }
  scope :alphabetical, -> { order(:name) }
end

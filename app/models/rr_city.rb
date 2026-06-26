# frozen_string_literal: true

class RrCity < ApplicationRecord
  scope :for_state, ->(code, state) { where(country_code: code.to_s.downcase, state_slug: state.to_s) }
  scope :alphabetical, -> { order(:name) }
end

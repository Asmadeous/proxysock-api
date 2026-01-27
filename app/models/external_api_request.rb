# frozen_string_literal: true

class ExternalApiRequest < ApplicationRecord
  belongs_to :related, polymorphic: true
end

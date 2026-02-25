# frozen_string_literal: true

class Cart < ApplicationRecord
  belongs_to :orderable, polymorphic: true, optional: true
end

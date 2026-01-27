# frozen_string_literal: true

class VmOrder < ApplicationRecord
  belongs_to :order
  has_one :vm, dependent: :destroy
end

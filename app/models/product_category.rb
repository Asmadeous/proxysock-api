# frozen_string_literal: true

class ProductCategory < ApplicationRecord
  scope :for_resellers, -> { where(available_to: %w[reseller both]) }
  scope :for_ecommerce, -> { where(available_to: %w[ecommerce both]) }

  validates :available_to, inclusion: { in: %w[reseller ecommerce both] }
end

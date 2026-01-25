class ProductCategory < ApplicationRecord
  scope :for_resellers, -> { where(available_to: ['reseller', 'both']) }
  scope :for_ecommerce, -> { where(available_to: ['ecommerce', 'both']) }
  
  validates :available_to, inclusion: { in: %w[reseller ecommerce both] }
end

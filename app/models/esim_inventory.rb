class EsimInventory < ApplicationRecord
  validates :iccid, presence: true, uniqueness: true
  validates :provider, presence: true
  
  scope :available, -> { where(status: 'available') }
  scope :lyca, -> { where(provider: 'lyca') }
  scope :colt, -> { where(provider: 'colt') }
  
  def mark_as_sold!
    update!(status: 'sold')
  end
end

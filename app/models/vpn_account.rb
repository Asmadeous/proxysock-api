class VpnAccount < ApplicationRecord
  belongs_to :order
  
  validates :username, presence: true
  validates :password, presence: true
  validates :server, presence: true
  
  enum :status, { pending: 'pending', active: 'active', expired: 'expired', revoked: 'revoked' }
end

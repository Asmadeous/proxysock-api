class VpnAccount < ApplicationRecord
  belongs_to :order
  
  def can_renew?
    status == 'active'
  end
  
  def renew!(duration_days = 30)
    # VPN is internal - just extend expiry
    update!(expires_at: (expires_at || Time.current) + duration_days.days)
  end
end

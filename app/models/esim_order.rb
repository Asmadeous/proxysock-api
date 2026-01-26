class EsimOrder < ApplicationRecord
  belongs_to :order
  
  def can_renew?
    # BLOCK renewal for inventory items (Lyca/Colt)
    return false if ['lyca', 'colt'].include?(esim_provider)
    
    # Allow for API-based (eSIM Access)
    esim_provider == 'esim_access'
  end
  
  def renew!(duration_days = 30, data_gb = 1)
    return false unless can_renew?
    
    if esim_provider == 'esim_access'
      # Call API to top-up
      service = EsimAccessService.new
      # result = service.top_up(iccid: esim&.iccid, package_code: package_code)
      # Assuming API success:
      
      update!(expires_at: (expires_at || Time.current) + duration_days.days)
      # Also update data allowance if tracking it
    end
  end
end

# frozen_string_literal: true

class MobileProxy < ApplicationRecord
  belongs_to :mobile_proxy_order, optional: true # Make optional to support direct Order association
  belongs_to :order, optional: true

  def can_renew?
    # Can renew if active and not an inventory item (if that concept applies)
    # Assuming mobile proxies are always renewable API items for now
    true
  end

  def renew!(duration_days = 30)
    if proxy_source == 'myproxyapi'
      # Call external API to renew
      MyProxyApiClient.new
      # client.renew_proxy(ip_address) # Pseudocode - assuming API method exists
      # Assuming API success:
    else
      # XProxy or other internal sources - just extend DB expiry
    end
    update!(expires_at: (expires_at || Time.current) + duration_days.days)
  end
end

# frozen_string_literal: true

class MobileProxy < ApplicationRecord
  belongs_to :mobile_proxy_order, optional: true
  belongs_to :order, optional: true
  belongs_to :localtonet_tunnel, optional: true

  # Provider scopes
  scope :localtonet, -> { where(proxy_source: 'localtonet') }
  scope :myproxyapi, -> { where(proxy_source: 'myproxyapi') }
  scope :active_proxies, -> { where(status: 'active') }

  def localtonet?
    proxy_source == 'localtonet'
  end

  def myproxyapi?
    proxy_source == 'myproxyapi'
  end

  def can_renew?
    true
  end

  def expire!
    revoke_localtonet_access!
    update!(status: 'expired')
  end

  def renew!(duration_days = 30)
    if localtonet?
      # Extend expiration logic
      # With Method 2 dedicated tunnels, LocalToNet natively doesn't auto-stop on a date.
      # ExpirationCleanupJob handles deletion on our end. So we just bump the local DB date.
      new_expiry = (expires_at || Time.current) + duration_days.days
      update!(expires_at: new_expiry)
    elsif myproxyapi?
      # Call external API to renew
      MyProxyApiClient.new
      # client.renew_proxy(ip_address)
    else
      # XProxy or other internal sources — just extend DB expiry
    end
    update!(expires_at: (expires_at || Time.current) + duration_days.days)
  end

  # Bandwidth tracking for per-GB LocalToNet proxies
  def bandwidth_limit_gb
    return nil unless bandwidth_limit_bytes

    (bandwidth_limit_bytes.to_f / 1.gigabyte).round(2)
  end

  def bandwidth_used_gb
    (bandwidth_used_bytes.to_f / 1.gigabyte).round(2)
  end

  def bandwidth_remaining_bytes
    return nil unless bandwidth_limit_bytes

    [bandwidth_limit_bytes - (bandwidth_used_bytes || 0), 0].max
  end

  def bandwidth_exceeded?
    return false unless bandwidth_limit_bytes

    (bandwidth_used_bytes || 0) >= bandwidth_limit_bytes
  end

  # Revoke access on LocalToNet when order expires (Method 2: Delete Dedicated Tunnel)
  def revoke_localtonet_access!
    return unless localtonet?

    tunnel_id = metadata&.dig('localtonet_tunnel_id')
    return unless tunnel_id

    client = LocaltonetApiClient.new
    client.delete_tunnel(tunnel_id)

    # Mark local tunnel record as offline
    localtonet_tunnel&.update(status: 'offline')
  rescue LocaltonetApiClient::ApiError => e
    Rails.logger.error("Failed to delete LocalToNet tunnel #{tunnel_id}: #{e.message}")
  end
end

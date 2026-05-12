# frozen_string_literal: true

class LocaltonetBandwidthSyncJob < ApplicationJob
  queue_as :default

  def perform
    Rails.logger.info 'Starting LocaltonetBandwidthSyncJob...'

    # Find all active mobile proxies from LocalToNet (Method 2: Dedicated Tunnels)
    # Each proxy has its own dedicated tunnel record.
    active_proxies = MobileProxy.where(status: 'active', proxy_source: 'localtonet')
                                .joins(:localtonet_tunnel)
                                .where.not(localtonet_tunnels: { localtonet_tunnel_id: nil })

    ltn_client = LocaltonetApiClient.new

    active_proxies.find_each do |proxy|
      tunnel_id = proxy.localtonet_tunnel.localtonet_tunnel_id

      # Fetch the tunnel's bandwidth usage directly
      usage_data = ltn_client.get_bandwidth_usage(tunnel_id)

      if usage_data && usage_data['bandwidthUsageByte']
        usage_bytes = usage_data['bandwidthUsageByte'].to_i

        # Only update if the usage has actually changed
        if proxy.bandwidth_used_bytes != usage_bytes
          proxy.update_columns(bandwidth_used_bytes: usage_bytes)

          # Mirror to order metadata for frontend display
          if proxy.order
            order = proxy.order
            order.metadata ||= {}
            proxy_details = order.metadata['proxy_details'] || {}
            proxy_details['traffic_used'] = usage_bytes
            proxy_details['traffic_limit_gb'] = proxy.bandwidth_limit_bytes ? (proxy.bandwidth_limit_bytes / 1.gigabyte.to_f) : nil

            order.metadata['proxy_details'] = proxy_details
            order.save!

            # Broadcast real-time update via ActionCable Websockets
            if order.orderable
              NotificationChannel.broadcast_to(
                order.orderable,
                {
                  type: 'bandwidth_update',
                  order_id: order.order_number,
                  bandwidth_used_bytes: usage_bytes,
                  bandwidth_limit_gb: proxy_details['traffic_limit_gb']
                }
              )
            end

            # Cost-saving: If bandwidth is exceeded, expire the proxy immediately (deletes the tunnel)
            if proxy.bandwidth_exceeded?
              Rails.logger.info "LocaltonetBandwidthSyncJob: Bandwidth exceeded for proxy ##{proxy.id}. Expiring..."
              proxy.expire!
            end
          end
        end
      else
        Rails.logger.warn "LocaltonetBandwidthSyncJob: Invalid usage data for tunnel #{tunnel_id}"
      end
    rescue LocaltonetApiClient::ApiError => e
      Rails.logger.error "LocaltonetBandwidthSyncJob: Failed to sync proxy ##{proxy.id} - #{e.message}"
    rescue StandardError => e
      Rails.logger.error "LocaltonetBandwidthSyncJob: Unexpected error for proxy ##{proxy.id} - #{e.message}"
    end

    Rails.logger.info 'LocaltonetBandwidthSyncJob completed.'
  end
end

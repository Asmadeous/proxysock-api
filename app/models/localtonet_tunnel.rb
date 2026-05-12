# frozen_string_literal: true

class LocaltonetTunnel < ApplicationRecord
  has_many :mobile_proxies, dependent: :nullify

  validates :localtonet_tunnel_id, presence: true, uniqueness: true
  validates :hostname, presence: true
  validates :port, presence: true

  scope :active, -> { where(status: 'active') }
  scope :usa, -> { where(country_code: 'US') }
  scope :available, -> { active.usa }

  # Sync this tunnel's details from LocalToNet API
  def sync_from_api!
    client = LocaltonetApiClient.new
    data = client.get_tunnel(localtonet_tunnel_id)

    update!(
      hostname: data['serverDomain'] || data['serverIp'] || hostname,
      port: data['serverPort'] || port,
      protocol_type: data['protocolType'] == 1 ? 'socks5' : 'http',
      status: data['status'] == 1 ? 'active' : 'offline',
      title: data['title'] || title,
      current_ip: data['clientIp'],
      last_health_check_at: Time.current,
      metadata: (metadata || {}).merge(
        'server_id' => data['serverId'],
        'auth_token_name' => data['authTokenName'],
        'last_synced' => Time.current.iso8601
      )
    )
  end

  # Number of active client credentials on this tunnel
  def active_clients_count
    mobile_proxies.where(status: 'active').count
  end
end

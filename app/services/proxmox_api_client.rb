class ProxmoxApiClient
  include HTTParty

  # We set verify: false because Proxmox often uses self-signed certs.

  def self.api_base
    ENV['PROXMOX_API_URL']
  end

  def self.headers
    token_id = ENV['PROXMOX_API_TOKEN_ID']
    token_secret = ENV['PROXMOX_API_TOKEN_SECRET']
    {
      'Authorization' => "PVEAPIToken=#{token_id}=#{token_secret}",
      'Accept' => 'application/json',
      'Content-Type' => 'application/json'
    }
  end

  # Returns current VM stats like {"cpu"=>0.005, "maxmem"=>..., "mem"=>..., "maxdisk"=>..., "disk"=>..., "uptime"=>...}
  def self.get_vm_status(node, vm_id)
    return nil if node.blank? || vm_id.blank? || api_base.blank?

    url = "#{api_base}/nodes/#{node}/qemu/#{vm_id}/status/current"
    
    response = get(url, headers: headers, verify: false, timeout: 5)
    if response.success?
      response['data']
    else
      Rails.logger.warn("ProxmoxApiClient GET status failed: #{response.code} #{response.message}")
      nil
    end
  rescue StandardError => e
    Rails.logger.error("ProxmoxApiClient failed to fetch status: #{e.message}")
    nil
  end
end

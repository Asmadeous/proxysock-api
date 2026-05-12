# frozen_string_literal: true

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
      'Content-Type' => 'application/json',
      'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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

  # Lists all QEMU VMs on a specific node
  # Returns array of VM hashes or empty array on failure
  def self.list_vms(node)
    return [] if node.blank? || api_base.blank?

    url = "#{api_base}/nodes/#{node}/qemu"
    response = get(url, headers: headers, verify: false, timeout: 10)

    if response.success?
      response['data'] || []
    else
      Rails.logger.warn("ProxmoxApiClient GET list_vms failed: #{response.code} #{response.message}")
      []
    end
  rescue StandardError => e
    Rails.logger.error("ProxmoxApiClient failed to list VMs: #{e.message}")
    []
  end

  # VM Power Control Methods
  def self.start_vm(node, vm_id)
    url = "#{api_base}/nodes/#{node}/qemu/#{vm_id}/status/start"
    post(url, headers: headers, verify: false, timeout: 15)
  end

  def self.stop_vm(node, vm_id)
    url = "#{api_base}/nodes/#{node}/qemu/#{vm_id}/status/stop"
    post(url, headers: headers, verify: false, timeout: 15)
  end

  def self.shutdown_vm(node, vm_id)
    url = "#{api_base}/nodes/#{node}/qemu/#{vm_id}/status/shutdown"
    post(url, headers: headers, verify: false, timeout: 15)
  end

  def self.reboot_vm(node, vm_id)
    url = "#{api_base}/nodes/#{node}/qemu/#{vm_id}/status/reboot"
    post(url, headers: headers, verify: false, timeout: 15)
  end

  # Triggers a cluster-wide or node-specific backup (vzdump)
  # Params should include node, storage, vmid (comma separated list), etc.
  def self.trigger_backup(node, params = {})
    return nil if node.blank? || api_base.blank?

    url = "#{api_base}/nodes/#{node}/vzdump"
    response = post(url, headers: headers, body: params.to_json, verify: false, timeout: 15)

    if response.success?
      response['data'] # This is usually the UPID of the backup task
    else
      Rails.logger.warn("ProxmoxApiClient POST vzdump failed: #{response.code} #{response.message}")
      nil
    end
  rescue StandardError => e
    Rails.logger.error("ProxmoxApiClient failed to trigger backup: #{e.message}")
    nil
  end
end

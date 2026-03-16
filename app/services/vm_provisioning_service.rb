# frozen_string_literal: true

require 'open3'
require 'fileutils'
require 'net/http'
require 'uri'
require 'json'
require 'shellwords'
require 'timeout'
require 'net/ssh'

class VmProvisioningService
  # Template configuration — Updated from Proxmox environment screenshot
  TEMPLATES = {
    # ── Ubuntu ────────────────────────────────────────────────────
    'ubuntu-22-04' => {
      id: ENV.fetch('TEMPLATE_UBUNTU_22_04', 2001).to_i,
      bridge: 'vmbr0',
      credentials: { user: 'odin', pass: ENV['VM_LINUX_TEMPLATE_PASSWORD'] },
      connection: { type: 'ssh' },
      os_family: 'ubuntu'
    },
    'ubuntu-vps' => {
      id: ENV.fetch('TEMPLATE_UBUNTU_VPS', 2001).to_i,
      bridge: 'vmbr0',
      credentials: { user: 'odin', pass: ENV['VM_LINUX_TEMPLATE_PASSWORD'] },
      connection: { type: 'ssh' },
      os_family: 'ubuntu'
    },

    # ── Alma Linux ────────────────────────────────────────────────
    'alma-vps' => {
      id: ENV.fetch('TEMPLATE_ALMA_VPS', 2005).to_i,
      bridge: 'vmbr0',
      credentials: { user: 'odin', pass: ENV['VM_LINUX_TEMPLATE_PASSWORD'] },
      connection: { type: 'ssh' },
      os_family: 'alma'
    },

    # ── Fedora (RDP desktop) ──────────────────────────────────────
    'fedora-rdp' => {
      id: ENV.fetch('TEMPLATE_FEDORA_RDP', 10_044).to_i,
      bridge: 'vmbr0',
      credentials: { user: 'odin', pass: ENV['VM_LINUX_TEMPLATE_PASSWORD'] },
      connection: { type: 'ssh' },
      os_family: 'fedora'
    },

    # ── Windows ───────────────────────────────────────────────────
    'windows-rdp' => {
      id: ENV.fetch('TEMPLATE_WINDOWS_RDP', 1001).to_i,
      bridge: 'vmbr0',
      credentials: { user: 'Administrator', pass: ENV['VM_WINDOWS_TEMPLATE_PASSWORD'] },
      connection: { type: 'winrm' },
      os_family: 'windows'
    },
    'windows-template' => {
      id: ENV.fetch('TEMPLATE_WINDOWS_BASE', 1006).to_i,
      bridge: 'vmbr0',
      credentials: { user: 'Administrator', pass: ENV['VM_WINDOWS_TEMPLATE_PASSWORD'] },
      connection: { type: 'winrm' },
      os_family: 'windows'
    }
  }.freeze

  PLAYBOOKS = {
    'ubuntu' => {
      'vps' => { 'managed' => 'ubuntu_vps_managed.yml',   'unmanaged' => 'ubuntu_vps_unmanaged.yml' },
      'rdp' => { 'managed' => 'ubuntu_rdp_managed.yml',   'unmanaged' => 'ubuntu_rdp_unmanaged.yml' }
    },
    'debian' => {
      'vps' => { 'managed' => 'debian_vps_managed.yml',   'unmanaged' => 'debian_vps_unmanaged.yml' },
      'rdp' => { 'managed' => 'debian_vps_managed.yml',   'unmanaged' => 'debian_vps_unmanaged.yml' }
    },
    'alma' => {
      'vps' => { 'managed' => 'alma_vps_managed.yml',     'unmanaged' => 'alma_vps_unmanaged.yml' },
      'rdp' => { 'managed' => 'alma_vps_managed.yml',     'unmanaged' => 'alma_vps_unmanaged.yml' }
    },
    'rocky' => {
      'vps' => { 'managed' => 'rocky_vps_managed.yml',    'unmanaged' => 'rocky_vps_unmanaged.yml' },
      'rdp' => { 'managed' => 'rocky_vps_managed.yml',    'unmanaged' => 'rocky_vps_unmanaged.yml' }
    },
    'fedora' => {
      'vps' => { 'managed' => 'fedora_rdp_managed.yml',   'unmanaged' => 'fedora_rdp_unmanaged.yml' },
      'rdp' => { 'managed' => 'fedora_rdp_managed.yml',   'unmanaged' => 'fedora_rdp_unmanaged.yml' }
    },
    'windows' => {
      'vps' => { 'managed' => 'windows_managed.yml',      'unmanaged' => 'windows_unmanaged.yml' },
      'rdp' => { 'managed' => 'windows_managed.yml',      'unmanaged' => 'windows_unmanaged.yml' }
    }
  }.freeze

  # Ensure the API URL always ends with /api2/json for correct endpoint routing
  PROXMOX_API_BASE = "#{ENV['PROXMOX_API_URL'].to_s.gsub(%r{/$}, '').gsub(%r{/api2/json$}, '')}/api2/json"

  PROXMOX_NODE = ENV['PROXMOX_NODE'] || 'pve'
  PUBLIC_IP = ENV['PUBLIC_IP'] || '127.0.0.1'
  PROXMOX_API_TOKEN_ID = ENV['PROXMOX_API_TOKEN_ID'] # e.g. root@pam!tokenid
  PROXMOX_API_TOKEN_SECRET = ENV['PROXMOX_API_TOKEN_SECRET']

  # Resolve playbook directory relative to Rails root
  PLAYBOOK_DIR = Rails.root.join('ansible', 'playbooks').to_s.freeze
  INVENTORY_DIR = Rails.root.join('ansible', 'inventory').to_s.freeze
  TARGETS_DIR = Rails.root.join('monitoring', 'prometheus', 'targets').to_s.freeze

  def initialize(order = nil, logger = Rails.logger)
    @order = order
    @logger = logger || Rails.logger
    @dns_service = CloudflareDnsService.new
    FileUtils.mkdir_p(INVENTORY_DIR) unless Dir.exist?(INVENTORY_DIR)
    FileUtils.mkdir_p(TARGETS_DIR) unless Dir.exist?(TARGETS_DIR)

    validate_config!
  end

  def provision(params)
    pve_vmid = nil
    actual_ip = nil
    hostname = nil

    begin
      @logger.info("Starting provisioning for params: #{params}")

      os_template = params['os_template']
      vm_type = params['vm_type']
      cpu_cores = params['cpu_cores'] || 2
      ram_gb = params['ram_gb'] || 4
      storage_gb = params['storage_gb'] || 60
      hostname = params['hostname'] || "vm-#{Time.now.to_i}"
      management_type = params['management_type'] || 'unmanaged'
      client_whitelist_ip = params['whitelist_ip']
      country_code = params['country_code'].to_s.upcase
      if %w[CA CANADA].include?(country_code)
        @logger.info('Country is Canada, skipping whitelist_ip for VM')
        client_whitelist_ip = nil
      end
      root_password = params['root_password'] || SecureRandom.hex(12)

      template_config = TEMPLATES[os_template]
      raise "Unsupported OS template: #{os_template}" unless template_config

      template_id = template_config[:id]
      bridge = template_config[:bridge]
      db_vm_id = params['db_vm_id']

      # Allocation
      pve_vmid = get_next_vm_id(vm_type)

      # Short hostname using the correct prefix
      hostname = "#{vm_type}-#{pve_vmid}"

      @logger.info("Allocated — PVE VMID: #{pve_vmid}, Hostname: #{hostname}, Type: #{vm_type}")

      # Creation (Clone)
      create_vm(pve_vmid, template_id, hostname, cpu_cores, ram_gb, storage_gb, bridge)

      mac_address = get_vm_mac_address(pve_vmid)

      raise "VM #{pve_vmid} failed to become ready" unless wait_for_vm_ready(pve_vmid)

      actual_ip = discover_and_bind_vm_ip(db_vm_id, pve_vmid, mac_address, hostname)
      @logger.info("VM #{pve_vmid} using IP: #{actual_ip}")

      # Connection details & Dynamic Port Calculation
      is_windows = template_config[:connection][:type] == 'winrm' || template_config[:os_family] == 'windows'
      rdp_access = is_windows || vm_type.to_s.include?('rdp')
      protocol = rdp_access ? 'rdp' : 'ssh'

      # Security: Use non-standard high ports based on VM ID
      # Range: SSH (10000-19999), RDP (30000-39999)
      custom_port = rdp_access ? (30_000 + pve_vmid.to_i) : (10_000 + pve_vmid.to_i)

      # DNS Setup (Optional Cloudflare integration with SRV)
      dns_name = @dns_service.create_vm_record(pve_vmid, actual_ip, custom_port, protocol)
      @logger.info("DNS records created: #{dns_name}") if dns_name

      # Ansible Setup
      if ansible_available?
        # We pass custom_port to ansible so it can configure the guest OS
        params_with_port = params.merge('custom_port' => custom_port)
        run_ansible_step(pve_vmid, actual_ip, template_config, root_password, params_with_port, hostname, management_type, os_template, client_whitelist_ip)
      else
        @logger.warn('[VmProvisioningService] Ansible not found in container! Skipping playbook')
      end

      # Monitoring (Managed Only)
      if management_type == 'managed'
        register_vm_with_monitoring(pve_vmid, actual_ip, hostname, os_template)
      end

      # Prepare result
      {
        status: 'success',
        pve_vmid: pve_vmid,
        ip_address: actual_ip,
        hostname: hostname,
        dns_name: dns_name,
        protocol: protocol,
        port: custom_port,
        username: rdp_access ? 'administrator' : 'root',
        password: root_password,
        root_password: root_password
      }
    rescue StandardError => e
      @logger.error("Provisioning failed: #{e.message}")
      @logger.error(e.backtrace.join("\n"))

      cleanup_vm(pve_vmid, actual_ip, hostname, nil, db_vm_id) if pve_vmid

      raise e
    end
  end

  def start_vm(vm_id)
    @logger.info("Starting VM #{vm_id}")
    response = proxmox_post("/nodes/#{PROXMOX_NODE}/qemu/#{vm_id}/status/start")
    wait_for_proxmox_task(response['data'])
  end

  def stop_vm(vm_id)
    @logger.info("Stopping VM #{vm_id} (Immediate)")
    response = proxmox_post("/nodes/#{PROXMOX_NODE}/qemu/#{vm_id}/status/stop")
    wait_for_proxmox_task(response['data'])
  end

  def shutdown_vm(vm_id)
    @logger.info("Shutting down VM #{vm_id} (Graceful)")
    response = proxmox_post("/nodes/#{PROXMOX_NODE}/qemu/#{vm_id}/status/shutdown")
    wait_for_proxmox_task(response['data'])
  end

  def reboot_vm(vm_id)
    @logger.info("Rebooting VM #{vm_id}")
    response = proxmox_post("/nodes/#{PROXMOX_NODE}/qemu/#{vm_id}/status/reboot")
    wait_for_proxmox_task(response['data'])
  end

  def cleanup_vm(pve_vmid, _actual_ip = nil, _hostname = nil, _mac_address = nil, db_vm_id = nil)
    return unless pve_vmid

    @logger.info("Starting cleanup for PVE VM #{pve_vmid}")

    # 1. Stop VM
    begin
      response = proxmox_post("/nodes/#{PROXMOX_NODE}/qemu/#{pve_vmid}/status/stop")
      wait_for_proxmox_task(response['data'])
    rescue StandardError => e
      @logger.debug("VM stop failed (might be stopped): #{e.message}")
    end

    # 2. Destroy VM
    begin
      response = proxmox_delete("/nodes/#{PROXMOX_NODE}/qemu/#{pve_vmid}?purge=1")
      wait_for_proxmox_task(response['data'])
      @logger.info("PVE VM #{pve_vmid} destroyed")
    rescue StandardError => e
      @logger.error("Failed to destroy PVE VM #{pve_vmid}: #{e.message}")
    end

    # 3. Clean inventory file
    inventory_file = File.join(INVENTORY_DIR, "vm_#{pve_vmid}.ini")
    FileUtils.rm_f(inventory_file) if File.exist?(inventory_file)

    # 4. Clean monitoring target
    unregister_vm_from_monitoring(pve_vmid)

    # 5. Release IP address back to pool
    # Use the database UUID (vm_id) if available, otherwise we can't reliably find it in IpAddress table
    IpAddress.find_by(vm_id: db_vm_id)&.release! if db_vm_id
  end

  # Determine which playbook to use based on vm_type, os_template, and management_type
  def determine_playbook(vm_type, os_template, management_type)
    template_config = TEMPLATES[os_template]
    os_family = template_config&.dig(:os_family) || 'ubuntu'

    # Normalize vm_type to 'vps' or 'rdp'
    normalized_type = vm_type.to_s.downcase.include?('rdp') ? 'rdp' : 'vps'
    normalized_mgmt = %w[managed unmanaged].include?(management_type.to_s) ? management_type.to_s : 'unmanaged'

    playbook = PLAYBOOKS.dig(os_family, normalized_type, normalized_mgmt)

    unless playbook
      @logger.warn("No playbook mapping for #{os_family}/#{normalized_type}/#{normalized_mgmt}, falling back to ubuntu_vps_unmanaged.yml")
      playbook = 'ubuntu_vps_unmanaged.yml'
    end

    playbook
  end

  def change_password(vm, new_password)
    return false unless ansible_available?

    @logger.info("Changing password for VM #{vm.id}")

    # Generate temporary inventory for this VM using root_password
    escaped_pass = Shellwords.escape(vm.root_password || '')
    user = (vm.vm_order&.os_type || '').downcase.include?('windows') ? 'Administrator' : 'root'

    inventory_content = if user == 'Administrator'
                          "[windows]\n#{vm.ip_address} ansible_user=#{user} ansible_password=#{escaped_pass} ansible_connection=winrm ansible_winrm_transport=ntlm ansible_winrm_server_cert_validation=ignore"
                        else
                          "[linux]\n#{vm.ip_address} ansible_user=#{user} ansible_ssh_pass=#{escaped_pass} ansible_connection=ssh ansible_ssh_common_args='-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null'"
                        end

    inventory_path = "/tmp/pwd_change_#{vm.id}.ini"
    File.write(inventory_path, inventory_content)

    begin
      # Prepare Ansible command
      extra_vars = {
        password: new_password,
        user: (vm.vm_order&.os_type || '').downcase.include?('windows') ? 'Administrator' : 'root'
      }.to_json

      # We need to decide which playbook to use.
      # For Windows, we might need a separate windows_change_password.yml or handle it in one.
      # Assuming change_password.yml handles Linux. Let's create a specialized one or detect.

      playbook = if (vm.vm_order&.os_type || '').downcase.include?('windows')
                   'windows_change_password.yml'
                 else
                   'change_password.yml'
                 end

      playbook_path = File.join(PLAYBOOK_DIR, playbook)
      result = execute_ansible_command(inventory_path, playbook_path, extra_vars)

      if result[:success]
        @logger.info("Password change successful for VM #{vm.id}")
        vm.update!(root_password: new_password)
        true
      else
        @logger.error("Password change failed for VM #{vm.id}: #{result[:stderr]}")
        false
      end
    ensure
      File.delete(inventory_path) if File.exist?(inventory_path)
    end
  end

  private

  def validate_config!
    raise 'PROXMOX_API_BASE is not set' if PROXMOX_API_BASE.blank? || PROXMOX_API_BASE.include?('nil')
    raise 'PROXMOX_API_TOKEN_ID is not set' if PROXMOX_API_TOKEN_ID.blank?
    raise 'PROXMOX_API_TOKEN_SECRET is not set' if PROXMOX_API_TOKEN_SECRET.blank?
  end

  def ansible_available?
    system('which ansible-playbook > /dev/null 2>&1')
  end

  def proxmox_headers
    {
      'Authorization' => "PVEAPIToken=#{PROXMOX_API_TOKEN_ID}=#{PROXMOX_API_TOKEN_SECRET}",
      'Accept' => 'application/json',
      'Content-Type' => 'application/json'
    }
  end

  def proxmox_get(path)
    url = "#{PROXMOX_API_BASE}#{path}"
    response = HTTParty.get(url, headers: proxmox_headers, verify: false, timeout: 15)
    handle_api_response(response)
  end

  def proxmox_post(path, body = {})
    url = "#{PROXMOX_API_BASE}#{path}"
    response = HTTParty.post(url, headers: proxmox_headers, body: body.to_json, verify: false, timeout: 15)
    handle_api_response(response)
  end

  def proxmox_put(path, body = {})
    url = "#{PROXMOX_API_BASE}#{path}"
    response = HTTParty.put(url, headers: proxmox_headers, body: body.to_json, verify: false, timeout: 15)
    handle_api_response(response)
  end

  def proxmox_delete(path)
    url = "#{PROXMOX_API_BASE}#{path}"
    response = HTTParty.delete(url, headers: proxmox_headers, verify: false)
    handle_api_response(response)
  end

  def handle_api_response(response)
    unless response.success?
      @logger.error("Proxmox API error: #{response.code} - #{response.body}")
      raise "Proxmox API error: #{response.code} - #{response.body}"
    end
    JSON.parse(response.body)
  rescue JSON::ParserError
    @logger.warn("Could not parse Proxmox API response: #{response.body}")
    { 'data' => response.body }
  end
  def wait_for_proxmox_task(upid)
    return unless upid

    300.times do
      status = proxmox_get("/nodes/#{PROXMOX_NODE}/tasks/#{upid}/status")['data']
      if status['status'] == 'stopped'
        if status['exitstatus'] == 'OK'
          return true
        else
          raise "Proxmox task failed: #{status['exitstatus']}"
        end
      end
      sleep 2
    end
    raise "Timeout waiting for Proxmox task #{upid}"
  end

  def get_next_vm_id(vm_type)
    range = vm_type.to_s.include?('rdp') ? (10_000..19_999) : (20_000..29_999)

    result = proxmox_get("/nodes/#{PROXMOX_NODE}/qemu")
    vms = result['data'] || []
    existing_ids = vms.map { |v| v['vmid'].to_i }

    range.each do |id|
      return id unless existing_ids.include?(id)
    end
    raise 'No available VM IDs in range'
  end

  def create_vm(vm_id, template_id, hostname, cpu_cores, ram_gb, storage_gb, bridge)
    @logger.info("Creating VM #{vm_id} from template #{template_id} via API")

    # 1. Clone
    response = proxmox_post("/nodes/#{PROXMOX_NODE}/qemu/#{template_id}/clone", {
                             newid: vm_id,
                             name: hostname,
                             full: 1
                           })
    upid = response['data']

    # 2. Wait for clone task to finish
    @logger.info("Waiting for clone task #{upid} to complete...")
    wait_for_proxmox_task(upid)

    # 3. Update resources & Networking
    ram_mb = ram_gb * 1024
    
    # Base configuration parameters
    config_params = {
      cores: cpu_cores,
      memory: ram_mb,
      net0: "virtio,bridge=#{bridge},firewall=1",
      agent: 1 # Ensure Guest Agent is enabled for IP discovery
    }

    @logger.info("Updating VM config for #{vm_id}: #{config_params}")
    response = proxmox_post("/nodes/#{PROXMOX_NODE}/qemu/#{vm_id}/config", config_params)
    wait_for_proxmox_task(response['data']) if response['data']

    # 4. Resize Disk (using dedicated endpoint with relative increment)
    # Fetch current config to identifying the correct disk key
    config = proxmox_get("/nodes/#{PROXMOX_NODE}/qemu/#{vm_id}/config")['data'] || {}
    disk_key = config.keys.find { |k| k.match(/^(scsi|virtio|ide|sata)0$/) }
    disk_config = config[disk_key] || ''

    if disk_key && disk_config.match(/size=(\d+)G/)
      current_size = ::Regexp.last_match(1).to_i
      if storage_gb > current_size
        increase = storage_gb - current_size
        @logger.info("Resizing #{disk_key} by adding #{increase}G (Target: #{storage_gb}G)...")
        response = proxmox_put("/nodes/#{PROXMOX_NODE}/qemu/#{vm_id}/resize", {
                                 disk: disk_key,
                                 size: "+#{increase}G"
                               })
        wait_for_proxmox_task(response['data']) if response['data']
      end
    end

    # 4. Start
    @logger.info("Starting VM #{vm_id}")
    response = proxmox_post("/nodes/#{PROXMOX_NODE}/qemu/#{vm_id}/status/start")
    wait_for_proxmox_task(response['data'])
  end

  def get_vm_mac_address(vm_id)
    config = proxmox_get("/nodes/#{PROXMOX_NODE}/qemu/#{vm_id}/config")['data'] || {}
    net0 = config['net0'] || ''
    if (match = net0.match(/virtio=([a-fA-F0-9:]{17})/))
      match[1]
    elsif (match = net0.match(/macaddr=([a-fA-F0-9:]{17})/))
      match[1]
    elsif (match = net0.match(/virtio,bridge=[^,]+,macaddr=([a-fA-F0-9:]{17})/))
      match[1]
    elsif (match = net0.match(/([a-fA-F0-9:]{17})/))
      # Try a cleaner regex for the MAC in the netX string
      match[1]
    else
      raise "Could not find MAC address for VM #{vm_id} in config: #{net0}"
    end
  end

  def wait_for_vm_ready(vm_id)
    30.times do
      status = proxmox_get("/nodes/#{PROXMOX_NODE}/qemu/#{vm_id}/status/current")['data'] || {}
      return true if status['status'] == 'running'

      sleep 2
    end
    false
  end

  def discover_and_bind_vm_ip(db_vm_id, pve_vmid, _expected_mac, hostname)
    actual_ip = nil
    actual_mac = nil

    @logger.info("Polling Guest Agent for VM #{pve_vmid} to find IP and MAC...")

    40.times do |attempt|
      begin
        result = proxmox_get("/nodes/#{PROXMOX_NODE}/qemu/#{pve_vmid}/agent/network-get-interfaces")
        if result.is_a?(Hash)
          # Proxmox API wraps the response in 'data', and the agent call itself often wraps in 'result'
          res_data = result['data'] || result
          interfaces = res_data.is_a?(Hash) ? (res_data['result'] || res_data['interfaces'] || res_data) : res_data
        else
          interfaces = result
        end

        Array(interfaces).each do |interface|
          # SAFETY: Skip if interface is not a hash (prevents 'no implicit conversion of String into Integer')
          next unless interface.is_a?(Hash)
          
          # Skip loopback and interfaces without IPs
          next if interface['name'] == 'lo' || interface['ip-addresses'].blank?

          interface['ip-addresses'].each do |ip_info|
            next unless ip_info['ip-address-type'] == 'ipv4'
            next if ip_info['ip-address'].start_with?('127.')

            actual_ip = ip_info['ip-address']
            actual_mac = interface['hardware-address']
            break
          end
          break if actual_ip
        end

        if actual_ip
          @logger.info("Found IP: #{actual_ip}, MAC: #{actual_mac} for VM #{pve_vmid} on attempt #{attempt + 1}")
          break
        end
      rescue StandardError => e
        @logger.debug("Guest agent query failed (attempt #{attempt + 1}): #{e.message}")
      end
      sleep 5
    end

    raise "Could not discover IP for VM #{pve_vmid} via Guest Agent" unless actual_ip

    # 1. Update the Vm record itself
    vm = Vm.find(db_vm_id)
    vm.update!(ip_address: actual_ip)

    # 2. Store in IpAddress table as assigned
    ip_record = IpAddress.find_or_initialize_by(address: actual_ip)
    ip_record.update!(
      status: 'assigned',
      vm_id: db_vm_id,
      assigned_at: Time.current
    )

    # 3. Whitelist in dnsmasq on Proxmox server
    whitelist_ip_on_dnsmasq(actual_mac, actual_ip, hostname)

    actual_ip
  end

  def whitelist_ip_on_dnsmasq(mac, ip, hostname)
    ssh_host = ENV['PROXMOX_SSH_HOST'] || PROXMOX_API_BASE.match(%r{https?://([^:/]+)})&.[](1)
    ssh_user = ENV['PROXMOX_SSH_USER'] || 'root'
    ssh_pass = ENV['PROXMOX_SSH_PASSWORD']
    ssh_key  = ENV['PROXMOX_SSH_KEY_PATH']

    return @logger.warn("SSH credentials missing, skipping dnsmasq whitelist") unless ssh_host && (ssh_pass || ssh_key)

    @logger.info("Whitelisting #{ip} (#{mac}) in dnsmasq on #{ssh_host}")

    dnsmasq_conf = "/etc/dnsmasq.d/proxysock_vms.conf"
    entry = "dhcp-host=#{mac},#{ip},#{hostname}"
    
    # Remote command to append entry and restart dnsmasq
    remote_cmd = <<~BASH
      grep -q "#{mac}" #{dnsmasq_conf} || echo "#{entry}" >> #{dnsmasq_conf}
      systemctl restart dnsmasq
    BASH

    begin
      ssh_options = ssh_key ? { keys: [ssh_key] } : { password: ssh_pass }
      # Ensure non-interactive and no host-key checking issues for simplicity in this env
      ssh_options[:append_all_supported_algorithms] = true
      ssh_options[:verify_host_key] = :never

      Net::SSH.start(ssh_host, ssh_user, ssh_options) do |ssh|
        # Use -S to read password from stdin if using password auth
        actual_cmd = ssh_pass ? "echo #{Shellwords.escape(ssh_pass)} | sudo -S bash -c '#{remote_cmd}'" : "sudo bash -c '#{remote_cmd}'"
        output = ssh.exec!(actual_cmd)
        @logger.info("Dnsmasq update output: #{output}")
      end
    rescue StandardError => e
      @logger.error("Failed to whitelist IP over SSH: #{e.message}")
    end
  end

  def run_ansible_step(vm_id, actual_ip, template_config, root_password, params, hostname, management_type, os_template, client_whitelist_ip)
    vm_type = params['vm_type']
    ansible_username = template_config[:credentials][:user]
    ansible_password = if template_config[:connection][:type] == 'winrm' || template_config[:os_family] == 'windows'
                         template_config[:credentials][:pass]
                       else
                         root_password.presence || template_config[:credentials][:pass]
                       end

    inventory_path = create_inventory(vm_id, actual_ip, template_config, ansible_username, ansible_password)

    # Select playbook
    playbook_name = determine_playbook(vm_type, os_template, management_type)
    playbook_path = File.join(PLAYBOOK_DIR, playbook_name)

    if File.exist?(playbook_path)
      extra_vars = build_extra_vars(
        vm_id: vm_id,
        hostname: hostname,
        management_type: management_type,
        os_family: template_config[:os_family], # Pass family for logic
        root_password: root_password,
        rdp_password: root_password,
        whitelist_ip: client_whitelist_ip,
        ip_address: actual_ip,
        proxy_params: params.slice('proxy_ip', 'proxy_port', 'proxy_username', 'proxy_password', 'proxy_protocol')
      )

      result = execute_ansible_command(inventory_path, playbook_path, extra_vars)
      raise "Configuration failed: #{result[:stderr]}" unless result[:success]
    else
      @logger.warn("Playbook #{playbook_path} not found, skipping Ansible run")
    end
  end

  def create_inventory(vm_id, ip_address, template_config, username, password)
    is_windows = (template_config[:connection][:type] == 'winrm')
    inventory_path = File.join(INVENTORY_DIR, "vm_#{vm_id}.ini")

    escaped_user = Shellwords.escape(username)
    escaped_pass = Shellwords.escape(password)

    if is_windows
      inventory_content = "[windows]\n#{ip_address} ansible_user=#{escaped_user} ansible_password=#{escaped_pass} ansible_connection=winrm ansible_winrm_transport=ntlm ansible_winrm_server_cert_validation=ignore ansible_port=5985 ansible_winrm_read_timeout_sec=60 ansible_winrm_operation_timeout_sec=30\n"
    else
      inventory_content = "[linux]\n#{ip_address} ansible_user=#{escaped_user} ansible_ssh_pass=#{escaped_pass} ansible_connection=ssh ansible_port=22 ansible_ssh_common_args='-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null'\n"
    end

    File.write(inventory_path, inventory_content)
    File.chmod(0o644, inventory_path)
    inventory_path
  end

  # Build extra_vars hash for the Ansible playbook, including proxy_config if proxy params exist
  def build_extra_vars(vm_id:, hostname:, management_type:, os_family:, root_password:, rdp_password:, whitelist_ip:,
                       ip_address: nil, proxy_params: {})
    vars = {
      vm_id: vm_id,
      hostname: hostname,
      management_type: management_type,
      os_family: os_family,
      root_password: root_password,
      rdp_password: rdp_password,
      api_url: ENV.fetch('APP_URL', "http://#{PUBLIC_IP}:3000"),
      api_key: ENV.fetch('VM_CALLBACK_API_KEY', 'internal-provisioning-key'),
      ip_address: ip_address
    }

    vars[:whitelist_ip] = whitelist_ip if whitelist_ip.present?

    # Build the proxy_config dict that playbooks expect
    if proxy_params['proxy_ip'].present?
      vars[:proxy_config] = {
        protocol: proxy_params['proxy_protocol'] || 'http',
        proxy_ip: proxy_params['proxy_ip'],
        proxy_port: proxy_params['proxy_port'],
        proxy_username: proxy_params['proxy_username'] || '',
        proxy_password: proxy_params['proxy_password'] || ''
      }
    end

    vars
  end

  def execute_ansible_command(inventory_path, playbook_path, extra_vars)
    cmd = [
      'ansible-playbook',
      '-i', inventory_path,
      playbook_path,
      '-e', extra_vars.to_json
    ]

    env = {
      'ANSIBLE_HOST_KEY_CHECKING' => 'False',
      'ANSIBLE_FORCE_COLOR' => 'True',
      'ANSIBLE_PYTHON_INTERPRETER' => 'auto_silent',
      'ANSIBLE_PIPELINING' => 'True',
      'ANSIBLE_SSH_CONTROL_PATH' => '/tmp/ansible-ssh-%%h-%%p-%%r'
    }

    @logger.info("Running Ansible Command: #{cmd.join(' ')}")

    combined_stdout = []
    combined_stderr = []

    Open3.popen3(env, *cmd) do |_stdin, stdout, stderr, wait_thr|
      stdout_thread = Thread.new do
        stdout.each_line do |line|
          clean_line = line.strip
          next if clean_line.empty?

          @logger.info("[Ansible STDOUT] #{clean_line}")
          combined_stdout << line
        end
      end

      stderr_thread = Thread.new do
        stderr.each_line do |line|
          clean_line = line.strip
          next if clean_line.empty?

          @logger.error("[Ansible STDERR] #{clean_line}")
          combined_stderr << line
        end
      end

      stdout_thread.join
      stderr_thread.join

      status = wait_thr.value
      { success: status.success?, stdout: combined_stdout.join, stderr: combined_stderr.join }
    end
  end

  def run_ansible_playbook_with_validation(inventory_path, playbook_path, extra_vars)
    execute_ansible_command(inventory_path, playbook_path, extra_vars)
  end

  def register_vm_with_monitoring(vm_id, ip, hostname, os_template)
    @logger.info("Registering VM #{vm_id} with Prometheus")
    template_config = TEMPLATES[os_template]
    port = template_config && template_config[:os_family] == 'windows' ? 59_182 : 59_100

    target = [
      {
        targets: ["#{ip}:#{port}"],
        labels: {
          vm_id: vm_id.to_s,
          hostname: hostname,
          os_family: template_config&.dig(:os_family) || 'unknown',
          management_type: 'managed'
        }
      }
    ]

    target_file = File.join(TARGETS_DIR, "vm_#{vm_id}.json")
    File.write(target_file, JSON.pretty_generate(target))
  rescue StandardError => e
    @logger.warn("Failed to register VM with monitoring: #{e.message}")
  end

  def unregister_vm_from_monitoring(vm_id)
    target_file = File.join(TARGETS_DIR, "vm_#{vm_id}.json")
    FileUtils.rm_f(target_file) if File.exist?(target_file)
  rescue StandardError => e
    @logger.warn("Failed to unregister VM from monitoring: #{e.message}")
  end
end

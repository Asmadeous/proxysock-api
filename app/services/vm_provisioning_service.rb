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
  # Template configuration — all VMs on vmbr0 (public bridge)
  TEMPLATES = {
    'ubuntu-rdp' => {
      id: ENV.fetch('TEMPLATE_UBUNTU_RDP', 103).to_i,
      bridge: 'vmbr0',
      credentials: { user: ENV.fetch('VM_LINUX_TEMPLATE_USER', 'ansible'), pass: ENV.fetch('VM_LINUX_TEMPLATE_PASSWORD', 'temporary') },
      connection: { type: 'ssh' },
      os_family: 'ubuntu'
    },
    'ubuntu-vps' => {
      id: ENV.fetch('TEMPLATE_UBUNTU_VPS', 105).to_i,
      bridge: 'vmbr0',
      credentials: { user: ENV.fetch('VM_LINUX_TEMPLATE_USER', 'ansible'), pass: ENV.fetch('VM_LINUX_TEMPLATE_PASSWORD', 'temporary') },
      connection: { type: 'ssh' },
      os_family: 'ubuntu'
    },
    'ubuntu-22-04' => {
      id: ENV.fetch('TEMPLATE_UBUNTU_VPS', 105).to_i,
      bridge: 'vmbr0',
      credentials: { user: ENV.fetch('VM_LINUX_TEMPLATE_USER', 'ansible'), pass: ENV.fetch('VM_LINUX_TEMPLATE_PASSWORD', 'temporary') },
      connection: { type: 'ssh' },
      os_family: 'ubuntu'
    },
    'debian-vps' => {
      id: ENV.fetch('TEMPLATE_DEBIAN_VPS', 107).to_i,
      bridge: 'vmbr0',
      credentials: { user: ENV.fetch('VM_LINUX_TEMPLATE_USER', 'ansible'), pass: ENV.fetch('VM_LINUX_TEMPLATE_PASSWORD', 'temporary') },
      connection: { type: 'ssh' },
      os_family: 'debian'
    },
    'alma-vps' => {
      id: ENV.fetch('TEMPLATE_ALMA_VPS', 108).to_i,
      bridge: 'vmbr0',
      credentials: { user: ENV.fetch('VM_LINUX_TEMPLATE_USER', 'ansible'), pass: ENV.fetch('VM_LINUX_TEMPLATE_PASSWORD', 'temporary') },
      connection: { type: 'ssh' },
      os_family: 'alma'
    },
    'rocky-vps' => {
      id: ENV.fetch('TEMPLATE_ROCKY_VPS', 106).to_i,
      bridge: 'vmbr0',
      credentials: { user: ENV.fetch('VM_LINUX_TEMPLATE_USER', 'ansible'), pass: ENV.fetch('VM_LINUX_TEMPLATE_PASSWORD', 'temporary') },
      connection: { type: 'ssh' },
      os_family: 'rocky'
    },
    'fedora-rdp' => {
      id: ENV.fetch('TEMPLATE_FEDORA_RDP', 104).to_i,
      bridge: 'vmbr0',
      credentials: { user: ENV.fetch('VM_LINUX_TEMPLATE_USER', 'ansible'), pass: ENV.fetch('VM_LINUX_TEMPLATE_PASSWORD', 'temporary') },
      connection: { type: 'ssh' },
      os_family: 'fedora'
    },
    # Windows on vmbr0 — direct public IP, no gateway needed
    'windows-rdp' => {
      id: ENV.fetch('TEMPLATE_WINDOWS_RDP', 102).to_i,
      bridge: 'vmbr0',
      credentials: { user: ENV.fetch('VM_WINDOWS_ADMIN_USER', 'Administrator'), pass: ENV['VM_WINDOWS_TEMPLATE_PASSWORD'] },
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

  PROXMOX_API_BASE = "#{ENV['PROXMOX_API_URL'].to_s.gsub(%r{/$}, '').gsub(%r{/api2/json$}, '')}/api2/json"
  PROXMOX_NODE = ENV['PROXMOX_NODE'] || 'pve'
  PUBLIC_IP = ENV['PUBLIC_IP'] || '127.0.0.1'
  PROXMOX_API_TOKEN_ID = ENV['PROXMOX_API_TOKEN_ID']
  PROXMOX_API_TOKEN_SECRET = ENV['PROXMOX_API_TOKEN_SECRET']

  PLAYBOOK_DIR = Rails.root.join('ansible', 'playbooks').to_s.freeze
  INVENTORY_DIR = Rails.root.join('ansible', 'inventory').to_s.freeze
  TARGETS_DIR = Rails.root.join('monitoring', 'prometheus', 'targets').to_s.freeze

  def initialize(order = nil, logger = Rails.logger)
    @order = order
    @logger = logger || Rails.logger
    FileUtils.mkdir_p(INVENTORY_DIR) unless Dir.exist?(INVENTORY_DIR)
    FileUtils.mkdir_p(TARGETS_DIR) unless Dir.exist?(TARGETS_DIR)
    validate_config!
  end

  def generate_secure_password(length = 20)
    # Using only alpha-numeric characters to avoid shell-mangling and JSON escaping issues
    # that were causing "Bad Credentials" errors on Windows RDP.
    uppercase = ('A'..'Z').to_a
    lowercase = ('a'..'z').to_a
    numbers = ('0'..'9').to_a
    
    # Ensure at least one of each class is present
    password = [uppercase.sample, lowercase.sample, numbers.sample]
    
    all_chars = uppercase + lowercase + numbers
    password += Array.new(length - 3) { all_chars.sample }
    
    password.shuffle.join
  end

  # Main provisioning method — unified flow for all OS types
  # All VMs are on vmbr0, get public IPs directly via DHCP/Guest Agent
  def provision(params)
    pve_vmid = nil
    actual_ip = nil
    hostname = nil

    begin
      @logger.info("Starting provisioning for params: #{params}")

      os_template = normalize_template_name(params['os_template'])
      vm_type = params['vm_type']
      cpu_cores = params['cpu_cores'] || 2
      ram_gb = params['ram_gb'] || 4
      storage_gb = params['storage_gb'] || 60
      hostname = params['hostname'].presence
      management_type = params['management_type'] || 'unmanaged'
      country_code = params['country_code'].to_s.upcase
      proxy_config = params['proxy'] || {}

      if %w[CA CANADA].include?(country_code)
        @logger.info("Country is #{country_code}, skipping proxy config for VM")
        proxy_config = {}
      end

      root_password = params['root_password'] || generate_secure_password
      template_config = TEMPLATES[os_template]
      raise "Unsupported OS template: #{os_template} (Original: #{params['os_template']})" unless template_config

      is_windows = template_config[:os_family] == 'windows'
      template_id = template_config[:id]
      bridge = template_config[:bridge]
      db_vm_id = params['db_vm_id']

      pve_vmid = get_next_vm_id(vm_type)
      hostname ||= "#{vm_type}-#{Array.new(6) { ('a'..'z').to_a.sample }.join}"

      @logger.info("Allocated — PVE VMID: #{pve_vmid}, Hostname: #{hostname}, Type: #{vm_type}")

      if db_vm_id
        Vm.find(db_vm_id).update!(proxmox_vm_id: pve_vmid.to_s)
      end

      # 1. Clone VM
      create_vm(pve_vmid, template_id, hostname, cpu_cores, ram_gb, storage_gb, bridge, os_template)

      # 2. Start VM
      start_vm(pve_vmid)
      raise "VM #{pve_vmid} failed to become ready" unless wait_for_vm_ready(pve_vmid)

      # 3. Get MAC address
      mac_address = get_vm_mac_address(pve_vmid)
      @logger.info("VM #{pve_vmid} has MAC: #{mac_address}")

      # 4. Discover IP (all VMs on vmbr0 get public IPs directly)
      actual_ip = discover_and_bind_vm_ip(db_vm_id, pve_vmid, mac_address, hostname, is_windows)
      @logger.info("VM #{pve_vmid} IP: #{actual_ip}")

      # 5. Port allocation
      rdp_access = is_windows || vm_type.to_s.include?('rdp')
      protocol = rdp_access ? 'rdp' : 'ssh'
      custom_port = generate_random_port

      if db_vm_id
        vm = Vm.find(db_vm_id)
        if protocol == 'rdp'
          vm.update!(ip_address: actual_ip, rdp_port: custom_port)
        else
          vm.update!(ip_address: actual_ip, ssh_port: custom_port)
        end
      end

      dns_name = nil

      # 6. Run Ansible (Tailscale for Linux is configured entirely by Ansible playbooks)
      if ansible_available?
        params_with_port = params.merge('custom_port' => custom_port)
        run_ansible_step(pve_vmid, actual_ip, template_config, root_password, params_with_port, hostname, management_type, os_template, proxy_config)
      else
        @logger.warn('[VmProvisioningService] Ansible not found in container! Skipping playbook')
      end

      # 7. Windows: Create Cloudflare DNS record (hostname.proxysock.com -> IP)
      if is_windows
        dns_service = CloudflareDnsService.new(@logger)
        dns_name = dns_service.create_vm_dns(hostname, actual_ip)
        @logger.info("Cloudflare DNS: #{dns_name}") if dns_name
      end

      # 8. Monitoring
      if management_type == 'managed'
        register_vm_with_monitoring(pve_vmid, actual_ip, hostname, os_template)
      end

      {
        status: 'success',
        pve_vmid: pve_vmid,
        ip_address: actual_ip,
        hostname: hostname,
        dns_name: dns_name,
        protocol: protocol,
        port: custom_port,
        username: is_windows ? 'Administrator' : hostname,
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
    wait_for_proxmox_task(response['data']) if response['data']
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

    captured_mac = nil
    begin
      captured_mac = get_vm_mac_address(pve_vmid)
    rescue StandardError => e
      @logger.debug("Could not capture MAC address before destruction: #{e.message}")
    end

    # Stop VM
    begin
      response = proxmox_post("/nodes/#{PROXMOX_NODE}/qemu/#{pve_vmid}/status/stop")
      wait_for_proxmox_task(response['data'])
    rescue StandardError => e
      @logger.debug("VM stop failed (might be stopped): #{e.message}")
    end

    # Destroy VM
    begin
      response = proxmox_delete("/nodes/#{PROXMOX_NODE}/qemu/#{pve_vmid}?purge=1")
      wait_for_proxmox_task(response['data'])
      @logger.info("PVE VM #{pve_vmid} destroyed")
    rescue StandardError => e
      @logger.error("Failed to destroy PVE VM #{pve_vmid}: #{e.message}")
    end

    # Clean inventory file
    inventory_file = File.join(INVENTORY_DIR, "vm_#{pve_vmid}.ini")
    FileUtils.rm_f(inventory_file) if File.exist?(inventory_file)

    # Clean monitoring target
    unregister_vm_from_monitoring(pve_vmid)

    if db_vm_id
      vm = Vm.find_by(id: db_vm_id)
      if vm
        # Delete Cloudflare DNS record for Windows VMs
        if vm.hostname.present?
          CloudflareDnsService.new(@logger).delete_vm_dns(vm.hostname)
        end

        # Release IP address
        IpAddress.find_by(vm_id: db_vm_id)&.release!
      end
    end

    remove_dnsmasq_entry(pve_vmid, captured_mac)
  end

  def remove_dnsmasq_entry(pve_vmid, mac_address = nil)
    ssh_host = ENV['PROXMOX_SSH_HOST'] || PROXMOX_API_BASE.match(%r{https?://([^:/]+)})&.[](1)
    ssh_user = ENV['PROXMOX_SSH_USER'] || 'root'
    ssh_pass = ENV['PROXMOX_SSH_PASSWORD']
    ssh_key  = ENV['PROXMOX_SSH_KEY_PATH']

    return @logger.warn('SSH credentials missing, skipping dnsmasq cleanup') unless ssh_host && (ssh_pass || ssh_key)

    dnsmasq_conf = '/etc/dnsmasq.d/proxysock_vms.conf'

    mac = mac_address
    if mac.blank?
      begin
        mac = get_vm_mac_address(pve_vmid)
      rescue StandardError
        @logger.warn("Could not get MAC for VM #{pve_vmid} during cleanup, skipping dnsmasq removal")
        return
      end
    end

    remote_cmd = <<~BASH
      sudo sed -i "/#{mac}/d" #{dnsmasq_conf}
      sudo systemctl restart dnsmasq
    BASH

    begin
      ssh_options = { password: ssh_pass }
      ssh_options[:append_all_supported_algorithms] = true
      ssh_options[:verify_host_key] = :never
      ssh_options[:non_interactive] = true
      ssh_options[:auth_methods] = ssh_key && File.exist?(ssh_key) ? %w[publickey password] : ['password']

      Net::SSH.start(ssh_host, ssh_user, ssh_options) do |ssh|
        actual_cmd = ssh_pass ? "echo #{Shellwords.escape(ssh_pass)} | sudo -S bash -c '#{remote_cmd}'" : "sudo -n bash -c '#{remote_cmd}'"
        output = ssh.exec!(actual_cmd)
        @logger.info("Dnsmasq cleanup output for VM #{pve_vmid}: #{output}")
      end
    rescue StandardError => e
      @logger.error("Failed to remove dnsmasq entry for VM #{pve_vmid}: #{e.message}")
    end
  end

  def determine_playbook(vm_type, os_template, management_type)
    template_config = TEMPLATES[os_template]
    os_family = template_config&.dig(:os_family) || 'ubuntu'

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

    safe_pass = "'#{(vm.root_password || '').gsub("'", "''")}'"
    user = (vm.vm_order&.os_type || '').downcase.include?('windows') ? 'Administrator' : 'root'

    inventory_content = if user == 'Administrator'
                          "[windows]\n#{vm.ip_address} ansible_user=#{user} ansible_password=#{safe_pass} ansible_connection=winrm ansible_winrm_transport=basic ansible_winrm_server_cert_validation=ignore ansible_port=5985"
                        else
                          "[linux]\n#{vm.ip_address} ansible_user=#{user} ansible_ssh_pass=#{safe_pass} ansible_connection=ssh ansible_ssh_common_args='-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null'"
                        end

    inventory_path = "/tmp/pwd_change_#{vm.id}.ini"
    File.write(inventory_path, inventory_content)

    begin
      extra_vars = {
        password: new_password,
        user: (vm.vm_order&.os_type || '').downcase.include?('windows') ? 'Administrator' : 'root'
      }.to_json

      playbook = (vm.vm_order&.os_type || '').downcase.include?('windows') ? 'windows_change_password.yml' : 'change_password.yml'
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

  def normalize_template_name(name)
    name = name.to_s.downcase.strip

    return 'ubuntu-rdp'   if name.include?('ubuntu') && name.include?('rdp')
    return 'fedora-rdp'   if name.include?('fedora') && name.include?('rdp')
    return 'windows-rdp'  if name.include?('windows')
    return 'ubuntu-vps'   if name.include?('ubuntu')
    return 'alma-vps'     if name.include?('alma')
    return 'rocky-vps'    if name.include?('rocky')
    return 'debian-vps'   if name.include?('debian')
    return 'fedora-rdp'   if name.include?('fedora')
    return name if TEMPLATES.key?(name)

    name
  end

  RANDOM_PORT_MIN = 10_000
  RANDOM_PORT_MAX = 59_999
  RESERVED_PORTS = [11_211, 27_017, 28_017, 33_060].freeze

  def generate_random_port(max_attempts = 50)
    used_ports = Vm.where.not(ssh_port: nil).pluck(:ssh_port) +
                 Vm.where.not(rdp_port: nil).pluck(:rdp_port)
    used_ports_set = Set.new(used_ports.compact + RESERVED_PORTS)

    max_attempts.times do
      port = rand(RANDOM_PORT_MIN..RANDOM_PORT_MAX)
      return port unless used_ports_set.include?(port)
    end

    (RANDOM_PORT_MIN..RANDOM_PORT_MAX).each do |port|
      return port unless used_ports_set.include?(port)
    end

    raise "No available ports in range #{RANDOM_PORT_MIN}-#{RANDOM_PORT_MAX}"
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
    with_retries do
      url = "#{PROXMOX_API_BASE}#{path}"
      response = HTTParty.get(url, headers: proxmox_headers, verify: false, timeout: 30)
      handle_api_response(response)
    end
  end

  def proxmox_post(path, body = {})
    with_retries do
      url = "#{PROXMOX_API_BASE}#{path}"
      response = HTTParty.post(url, headers: proxmox_headers, body: body.to_json, verify: false, timeout: 30)
      handle_api_response(response)
    end
  end

  def proxmox_put(path, body = {})
    with_retries do
      url = "#{PROXMOX_API_BASE}#{path}"
      response = HTTParty.put(url, headers: proxmox_headers, body: body.to_json, verify: false, timeout: 30)
      handle_api_response(response)
    end
  end

  def proxmox_delete(path)
    with_retries do
      url = "#{PROXMOX_API_BASE}#{path}"
      response = HTTParty.delete(url, headers: proxmox_headers, verify: false, timeout: 30)
      handle_api_response(response)
    end
  end

  def with_retries(max_retries = 3)
    attempt = 0
    begin
      attempt += 1
      yield
    rescue Net::OpenTimeout, Net::ReadTimeout, Errno::ECONNREFUSED, Errno::ECONNRESET, SocketError => e
      if attempt < max_retries
        @logger.warn("Proxmox API trial failed (#{e.message}), retrying #{attempt}/#{max_retries}...")
        sleep 2
        retry
      end
      raise e
    end
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
        exit_status = status['exitstatus']
        return true if exit_status == 'OK' || exit_status&.start_with?('WARNINGS')

        raise "Proxmox task failed: #{exit_status}"
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

  def create_vm(vm_id, template_id, hostname, cpu_cores, ram_gb, storage_gb, bridge, os_template)
    @logger.info("Creating VM #{vm_id} from template #{template_id} via API")

    response = proxmox_post("/nodes/#{PROXMOX_NODE}/qemu/#{template_id}/clone", {
                              newid: vm_id,
                              name: hostname,
                              full: false # Linked clone for all VMs (fast)
                            })
    upid = response['data']
    @logger.info("Waiting for clone task #{upid} to complete...")
    wait_for_proxmox_task(upid)

    ram_mb = ram_gb * 1024
    config_params = {
      cores: cpu_cores,
      memory: ram_mb,
      net0: "virtio,bridge=#{bridge},firewall=1",
      agent: 1,
      machine: 'pc-q35-9.0'
    }

    if os_template.include?('rdp') || os_template.include?('windows')
      config_params.merge!({
                             scsihw: 'virtio-scsi-pci',
                             cpu: 'host',
                             vga: 'virtio,memory=128'
                           })
      config_params[:ostype] = os_template.include?('windows') ? 'win11' : 'l26'
    end

    @logger.info("Updating VM config for #{vm_id}: #{config_params}")
    response = proxmox_post("/nodes/#{PROXMOX_NODE}/qemu/#{vm_id}/config", config_params)
    wait_for_proxmox_task(response['data']) if response['data']

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

    detach_params = {}
    config.each do |key, value|
      if key.to_s.match(/^(ide|sata|scsi)\d+$/) && value.to_s.include?('media=cdrom')
        @logger.info("Detaching CD-ROM on #{key} to avoid missing ISO errors")
        detach_params[key] = 'none,media=cdrom'
      end
    end
    proxmox_post("/nodes/#{PROXMOX_NODE}/qemu/#{vm_id}/config", detach_params) if detach_params.any?
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

  # Discover IP via Guest Agent — all VMs on vmbr0 get public IPs directly
  def discover_and_bind_vm_ip(db_vm_id, pve_vmid, mac_address, hostname, is_windows = false)
    actual_ip = nil
    actual_mac = mac_address

    max_retries = is_windows ? 36 : 12  # Windows needs longer to boot

    max_retries.times do |attempt|
      begin
        result = proxmox_get("/nodes/#{PROXMOX_NODE}/qemu/#{pve_vmid}/agent/network-get-interfaces")
        if result.is_a?(Hash)
          res_data = result['data'] || result
          interfaces = res_data.is_a?(Hash) ? (res_data['result'] || res_data['interfaces'] || res_data) : res_data
        else
          interfaces = result
        end

        Array(interfaces).each do |interface|
          next unless interface.is_a?(Hash)
          next if interface['name'] == 'lo' || interface['ip-addresses'].blank?

          interface['ip-addresses'].each do |ip_info|
            next unless ip_info['ip-address-type'] == 'ipv4'
            next if ip_info['ip-address'].start_with?('127.', '169.254.')

            actual_ip = ip_info['ip-address']
            actual_mac = interface['hardware-address'] || mac_address
            break
          end
          break if actual_ip
        end

        if actual_ip
          @logger.info("Found IP: #{actual_ip}, MAC: #{actual_mac} for VM #{pve_vmid}")
          break
        end
      rescue StandardError => e
        @logger.debug("Guest agent query failed (attempt #{attempt + 1}): #{e.message}")
      end
      sleep 10
    end

    raise "Could not discover IP for VM #{pve_vmid} via Guest Agent" unless actual_ip

    # All VMs on vmbr0 — store IP directly
    vm = Vm.find(db_vm_id)
    vm.update!(ip_address: actual_ip)

    ip_record = IpAddress.find_or_initialize_by(address: actual_ip)
    ip_record.update!(status: 'assigned', vm_id: db_vm_id, assigned_at: Time.current)

    # Whitelist in dnsmasq
    whitelist_ip_on_dnsmasq(actual_mac, actual_ip, hostname)

    actual_ip
  end

  def whitelist_ip_on_dnsmasq(mac, ip, hostname)
    ssh_host = ENV['PROXMOX_SSH_HOST'] || PROXMOX_API_BASE.match(%r{https?://([^:/]+)})&.[](1)
    ssh_user = ENV['PROXMOX_SSH_USER'] || 'root'
    ssh_pass = ENV['PROXMOX_SSH_PASSWORD']
    ssh_key  = ENV['PROXMOX_SSH_KEY_PATH']

    return @logger.warn('SSH credentials missing, skipping dnsmasq whitelist') unless ssh_host && (ssh_pass || ssh_key)

    @logger.info("Whitelisting #{ip} (#{mac}) in dnsmasq on #{ssh_host}")

    dnsmasq_conf = '/etc/dnsmasq.d/proxysock_vms.conf'
    entry = "dhcp-host=#{mac},#{ip},#{hostname}"

    remote_cmd = <<~BASH
      sudo grep -q "#{mac}" #{dnsmasq_conf} || echo "#{entry}" | sudo tee -a #{dnsmasq_conf} > /dev/null
      sudo systemctl restart dnsmasq
    BASH

    begin
      ssh_options = { password: ssh_pass }
      ssh_options[:append_all_supported_algorithms] = true
      ssh_options[:verify_host_key] = :never
      ssh_options[:non_interactive] = true
      ssh_options[:auth_methods] = ssh_key && File.exist?(ssh_key) ? %w[publickey password] : ['password']

      Net::SSH.start(ssh_host, ssh_user, ssh_options) do |ssh|
        actual_cmd = ssh_pass ? "echo #{Shellwords.escape(ssh_pass)} | sudo -S bash -c '#{remote_cmd}'" : "sudo -n bash -c '#{remote_cmd}'"
        output = ssh.exec!(actual_cmd)
        @logger.info("Dnsmasq update output: #{output}")
      end
    rescue Net::SSH::AuthenticationFailed
      @logger.error("Failed to whitelist IP over SSH: Authentication failed for user #{ssh_user}@#{ssh_host}")
    rescue StandardError => e
      @logger.error("Failed to whitelist IP over SSH: #{e.message}")
    end
  end

  def run_ansible_step(vm_id, ansible_connect_ip, template_config, root_password, params, hostname, management_type, os_template, proxy_config)
    vm_type = params['vm_type']
    ansible_username = template_config[:credentials][:user]
    ansible_password = template_config[:credentials][:pass]

    inventory_path = create_inventory(vm_id, ansible_connect_ip, template_config, ansible_username, ansible_password)

    playbook_name = determine_playbook(vm_type, os_template, management_type)
    playbook_path = File.join(PLAYBOOK_DIR, playbook_name)

    if File.exist?(playbook_path)
      extra_vars = build_extra_vars(
        vm_id: vm_id,
        hostname: hostname,
        management_type: management_type,
        os_family: template_config[:os_family],
        os_template: os_template,
        root_password: root_password,
        rdp_password: root_password,
        ip_address: ansible_connect_ip,
        proxy_params: proxy_config,
        custom_port: params['custom_port']
      )

      result = execute_ansible_command(inventory_path, playbook_path, extra_vars)
      raise "Configuration failed: #{result[:stderr]}" unless result[:success]

      result
    else
      @logger.warn("Playbook #{playbook_path} not found, skipping Ansible run")
      nil
    end
  end

  def create_inventory(vm_id, ip_address, template_config, username, password)
    is_windows = (template_config[:connection][:type] == 'winrm')
    inventory_path = File.join(INVENTORY_DIR, "vm_#{vm_id}.ini")

    safe_user = "'#{username.gsub("'", "''")}'"
    safe_pass = "'#{password.gsub("'", "''")}'"

    if is_windows
      inventory_content = "[windows]\n#{ip_address} ansible_user=#{safe_user} ansible_password=#{safe_pass} ansible_connection=winrm ansible_winrm_transport=basic ansible_winrm_server_cert_validation=ignore ansible_port=5985 ansible_winrm_read_timeout_sec=60 ansible_winrm_operation_timeout_sec=30\n"
    else
      inventory_content = "[linux]\n#{ip_address} ansible_user=#{safe_user} ansible_ssh_pass=#{safe_pass} ansible_become_password=#{safe_pass} ansible_connection=ssh ansible_port=22 ansible_ssh_common_args='-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o PubkeyAuthentication=no -o PreferredAuthentications=password'\n"
    end

    File.write(inventory_path, inventory_content)
    File.chmod(0o644, inventory_path)
    inventory_path
  end

  # Build extra_vars for Ansible
  # Linux VMs: Tailscale VPN config (Ansible installs/configures it)
  # Windows VMs: Cloudflare tunnel config (replaces Tailscale)
  def build_extra_vars(vm_id:, hostname:, management_type:, os_family:, root_password:, rdp_password:,
                       os_template: 'unknown', ip_address: nil, proxy_params: {}, custom_port: 22)
    vars = {
      vm_id: vm_id,
      hostname: hostname,
      management_type: management_type,
      os_family: os_family,
      os_template: os_template,
      root_password: root_password,
      rdp_password: rdp_password,
      api_url: ENV.fetch('APP_URL', "http://#{PUBLIC_IP}:3000"),
      api_key: ENV.fetch('VM_CALLBACK_API_KEY', 'internal-provisioning-key'),
      ip_address: ip_address,
      custom_port: custom_port
    }

    if proxy_params['ip'].present?
      vars[:proxy_config] = {
        protocol: proxy_params['protocol'] || 'http',
        proxy_ip: proxy_params['ip'],
        proxy_port: proxy_params['port'],
        proxy_username: proxy_params['username'] || '',
        proxy_password: proxy_params['password'] || ''
      }
    else
      # Linux only: Tailscale VPN (configured by Ansible)
      # Windows: no VPN config needed — Cloudflare DNS handled by Ruby after provisioning
      unless os_family == 'windows'
        ts_auth_key = ENV['TAILSCALE_AUTH_KEY']
        ts_exit_node = ENV['TAILSCALE_EXIT_NODE_IP']
        if ts_auth_key.present? && ts_exit_node.present?
          vars[:tailscale_config] = {
            auth_key: ts_auth_key,
            exit_node_ip: ts_exit_node
          }
        end
      end
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
      'ANSIBLE_CONFIG' => File.join(Rails.root, 'ansible', 'ansible.cfg'),
      'ANSIBLE_HOST_KEY_CHECKING' => 'False',
      'ANSIBLE_FORCE_COLOR' => 'True',
      'ANSIBLE_PYTHON_INTERPRETER' => 'auto_silent',
      'ANSIBLE_PIPELINING' => 'True',
      'ANSIBLE_SSH_CONTROL_PATH' => '/tmp/ansible-ssh-%%h-%%p-%%r',
      'ANSIBLE_COLLECTIONS_PATH' => '/usr/share/ansible/collections:/home/rails/.ansible/collections'
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
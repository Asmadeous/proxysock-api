# frozen_string_literal: true

require 'open3'
require 'fileutils'
require 'net/http'
require 'uri'
require 'json'
require 'shellwords'
require 'timeout'

class VmProvisioningService
  # Template configuration — Proxmox template IDs are PLACEHOLDERS.
  # Update the `id:` values once you create the actual Proxmox VM templates.
  TEMPLATES = {
    # ── Ubuntu ────────────────────────────────────────────────────
    'ubuntu-20-04' => {
      id: 9000, # PLACEHOLDER — set to your actual Proxmox template VMID
      bridge: 'vmbr0',
      credentials: { user: 'odin', pass: ENV['VM_LINUX_TEMPLATE_PASSWORD'] },
      connection: { type: 'ssh' },
      os_family: 'ubuntu'
    },
    'ubuntu-22-04' => {
      id: 9001, # PLACEHOLDER
      bridge: 'vmbr0',
      credentials: { user: 'odin', pass: ENV['VM_LINUX_TEMPLATE_PASSWORD'] },
      connection: { type: 'ssh' },
      os_family: 'ubuntu'
    },
    'ubuntu-24-04' => {
      id: 9002, # PLACEHOLDER
      bridge: 'vmbr0',
      credentials: { user: 'odin', pass: ENV['VM_LINUX_TEMPLATE_PASSWORD'] },
      connection: { type: 'ssh' },
      os_family: 'ubuntu'
    },

    # ── Debian ────────────────────────────────────────────────────
    'debian-11' => {
      id: 9010, # PLACEHOLDER
      bridge: 'vmbr0',
      credentials: { user: 'odin', pass: ENV['VM_LINUX_TEMPLATE_PASSWORD'] },
      connection: { type: 'ssh' },
      os_family: 'debian'
    },
    'debian-12' => {
      id: 9011, # PLACEHOLDER
      bridge: 'vmbr0',
      credentials: { user: 'odin', pass: ENV['VM_LINUX_TEMPLATE_PASSWORD'] },
      connection: { type: 'ssh' },
      os_family: 'debian'
    },

    # ── Alma Linux ────────────────────────────────────────────────
    'alma-8' => {
      id: 9020, # PLACEHOLDER
      bridge: 'vmbr0',
      credentials: { user: 'odin', pass: ENV['VM_LINUX_TEMPLATE_PASSWORD'] },
      connection: { type: 'ssh' },
      os_family: 'alma'
    },
    'alma-9' => {
      id: 9021, # PLACEHOLDER
      bridge: 'vmbr0',
      credentials: { user: 'odin', pass: ENV['VM_LINUX_TEMPLATE_PASSWORD'] },
      connection: { type: 'ssh' },
      os_family: 'alma'
    },

    # ── Rocky Linux ───────────────────────────────────────────────
    'rocky-8' => {
      id: 9030, # PLACEHOLDER
      bridge: 'vmbr0',
      credentials: { user: 'odin', pass: ENV['VM_LINUX_TEMPLATE_PASSWORD'] },
      connection: { type: 'ssh' },
      os_family: 'rocky'
    },
    'rocky-9' => {
      id: 9031, # PLACEHOLDER
      bridge: 'vmbr0',
      credentials: { user: 'odin', pass: ENV['VM_LINUX_TEMPLATE_PASSWORD'] },
      connection: { type: 'ssh' },
      os_family: 'rocky'
    },

    # ── Fedora (RDP desktop) ──────────────────────────────────────
    'fedora-rdp' => {
      id: 9040, # PLACEHOLDER
      bridge: 'vmbr0',
      credentials: { user: 'odin', pass: ENV['VM_LINUX_TEMPLATE_PASSWORD'] },
      connection: { type: 'ssh' },
      os_family: 'fedora'
    },

    # ── Windows ───────────────────────────────────────────────────
    'windows-server-2022' => {
      id: 9100, # PLACEHOLDER
      bridge: 'vmbr0',
      credentials: { user: 'Administrator', pass: ENV['VM_WINDOWS_TEMPLATE_PASSWORD'] },
      connection: { type: 'winrm' },
      os_family: 'windows'
    },
    'windows-server-2019' => {
      id: 9101, # PLACEHOLDER
      bridge: 'vmbr0',
      credentials: { user: 'Administrator', pass: ENV['VM_WINDOWS_TEMPLATE_PASSWORD'] },
      connection: { type: 'winrm' },
      os_family: 'windows'
    }
  }.freeze

  # Playbook lookup table: [os_family][vm_type][management_type] → filename
  # vm_type is either 'vps' or 'rdp'
  PLAYBOOKS = {
    'ubuntu' => {
      'vps' => { 'managed' => 'ubuntu_vps_managed.yml',   'unmanaged' => 'ubuntu_vps_unmanaged.yml' },
      'rdp' => { 'managed' => 'ubuntu_rdp_managed.yml',   'unmanaged' => 'ubuntu_rdp_unmanaged.yml' }
    },
    'debian' => {
      'vps' => { 'managed' => 'debian_vps_managed.yml',   'unmanaged' => 'debian_vps_unmanaged.yml' },
      'rdp' => { 'managed' => 'debian_vps_managed.yml',   'unmanaged' => 'debian_vps_unmanaged.yml' } # No dedicated Debian RDP playbook; fallback to VPS
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

  PROXMOX_NODE = ENV['PROXMOX_NODE'] || 'pve'
  PUBLIC_IP = ENV['PUBLIC_IP'] || '127.0.0.1'

  # Resolve playbook directory relative to Rails root
  PLAYBOOK_DIR = Rails.root.join('ansible', 'playbooks').to_s.freeze
  INVENTORY_DIR = Rails.root.join('ansible', 'inventory').to_s.freeze

  def initialize(order = nil, logger = Rails.logger)
    @order = order
    @logger = logger
    FileUtils.mkdir_p(INVENTORY_DIR) unless Dir.exist?(INVENTORY_DIR)
  end

  def provision(params)
    vm_id = nil
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
      root_password = params['root_password'] || SecureRandom.hex(12)

      template_config = TEMPLATES[os_template]
      raise "Unsupported OS template: #{os_template}" unless template_config

      template_id = template_config[:id]
      bridge = template_config[:bridge]

      # Allocation
      vm_id = get_next_vm_id(vm_type)

      @logger.info("Allocated — VM ID: #{vm_id}")

      # Creation
      create_vm(vm_id, template_id, hostname, cpu_cores, ram_gb, storage_gb, bridge)

      mac_address = get_vm_mac_address(vm_id)

      raise "VM #{vm_id} failed to become ready" unless wait_for_vm_ready(vm_id)

      actual_ip = discover_and_bind_vm_ip(vm_id, mac_address, hostname)
      @logger.info("VM #{vm_id} bound to IP: #{actual_ip}")

      # Connection details
      is_windows = template_config[:connection][:type] == 'winrm' || template_config[:os_family] == 'windows'
      rdp_access = is_windows || vm_type.to_s.include?('rdp')
      protocol = rdp_access ? 'rdp' : 'ssh'

      # Ansible Setup
      ansible_username = template_config[:credentials][:user]
      ansible_password = is_windows ? template_config[:credentials][:pass] : (root_password.presence || template_config[:credentials][:pass])

      inventory_path = create_inventory(vm_id, actual_ip, template_config, ansible_username, ansible_password)

      # Select playbook
      playbook_name = determine_playbook(vm_type, os_template, management_type)
      playbook_path = File.join(PLAYBOOK_DIR, playbook_name)

      if File.exist?(playbook_path)
        extra_vars = build_extra_vars(
          vm_id: vm_id,
          hostname: hostname,
          management_type: management_type,
          os_template: os_template,
          root_password: root_password,
          rdp_password: root_password,
          whitelist_ip: client_whitelist_ip,
          proxy_params: params.slice('proxy_ip', 'proxy_port', 'proxy_username', 'proxy_password', 'proxy_protocol')
        )

        result = run_ansible_playbook_with_validation(inventory_path, playbook_path, extra_vars)
        raise "Configuration failed: #{result[:stderr]}" unless result[:success]
      else
        @logger.warn("Playbook #{playbook_path} not found, skipping Ansible run (DEV MODE)")
      end

      # Prepare result
      {
        status: 'success',
        vm_id: vm_id,
        ip_address: actual_ip,
        hostname: hostname,
        protocol: protocol,
        username: rdp_access ? 'administrator' : 'root',
        password: root_password,
        root_password: root_password
      }
    rescue StandardError => e
      @logger.error("Provisioning failed: #{e.message}")
      @logger.error(e.backtrace.join("\n"))

      cleanup_vm(vm_id, actual_ip, hostname) if vm_id

      raise e
    end
  end

  def start_vm(vm_id)
    @logger.info("Starting VM #{vm_id}")
    execute_command("qm start #{vm_id}", true)
  end

  def stop_vm(vm_id)
    @logger.info("Stopping VM #{vm_id} (Immediate)")
    execute_command("qm stop #{vm_id}", true)
  end

  def shutdown_vm(vm_id)
    @logger.info("Shutting down VM #{vm_id} (Graceful)")
    execute_command("qm shutdown #{vm_id}", true)
  end

  def reboot_vm(vm_id)
    @logger.info("Rebooting VM #{vm_id}")
    execute_command("qm reboot #{vm_id}", true)
  end

  def cleanup_vm(vm_id, _actual_ip = nil, _hostname = nil, _mac_address = nil)
    return unless vm_id

    @logger.info("Starting cleanup for VM #{vm_id}")

    # 1. Stop VM
    begin
      execute_command("qm stop #{vm_id} --skiplock", true)
      sleep 3
    rescue StandardError => e
      @logger.debug("VM stop failed (might be stopped): #{e.message}")
    end

    # 2. Destroy VM
    begin
      execute_command("qm destroy #{vm_id} --purge --skiplock", true)
      @logger.info("VM #{vm_id} destroyed")
    rescue StandardError => e
      @logger.error("Failed to destroy VM #{vm_id}: #{e.message}")
    end

    # 3. Clean inventory file
    inventory_file = File.join(INVENTORY_DIR, "vm_#{vm_id}.ini")
    FileUtils.rm_f(inventory_file) if File.exist?(inventory_file)

    # 4. Clean DHCP reservation (simplified)
    # Extend this when your DHCP setup is finalized
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
    @logger.info("Changing password for VM #{vm.id}")

    # Generate temporary inventory for this VM
    inventory_content = "[vms]\n#{vm.ip_address} ansible_user=root ansible_ssh_private_key_file=/root/.ssh/id_rsa"
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

      @logger.info("Running playbook #{playbook} for VM #{vm.id}")

      # Use same logic as check_vm_status or provision
      cmd = [
        { 'ANSIBLE_HOST_KEY_CHECKING' => 'False' },
        'ansible-playbook',
        '-i', inventory_path,
        File.join(PLAYBOOK_DIR, playbook),
        '--extra-vars', extra_vars
      ]
      _, stderr, status = Open3.capture3(*cmd)

      if status.success?
        @logger.info("Password change successful for VM #{vm.id}")
        vm.update!(root_password: new_password)
        true
      else
        @logger.error("Password change failed for VM #{vm.id}: #{stderr}")
        false
      end
    ensure
      File.delete(inventory_path) if File.exist?(inventory_path)
    end
  end

  private

  def execute_command(cmd, log_output = false)
    @logger.debug("Executing: #{cmd}")
    stdout, stderr, status = Open3.capture3(cmd)

    if log_output
      @logger.info("Command output: #{stdout}") unless stdout.empty?
      @logger.error("Command error: #{stderr}") unless stderr.empty?
    end

    raise "Command failed: #{stderr}" unless status.success?

    stdout.strip
  end

  def get_next_vm_id(vm_type)
    range = vm_type.to_s.include?('rdp') ? (10_000..19_999) : (20_000..29_999)

    existing_vms_output = execute_command("qm list | awk 'NR>1 {print $1}'")
    existing_vms = existing_vms_output.split("\n").map(&:to_i)

    range.each do |id|
      return id unless existing_vms.include?(id)
    end
    raise 'No available VM IDs in range'
  end

  def create_vm(vm_id, template_id, hostname, cpu_cores, ram_gb, storage_gb, bridge)
    @logger.info("Creating VM #{vm_id} from template #{template_id}")
    execute_command("qm clone #{template_id} #{vm_id} --name #{hostname}", true)

    ram_mb = ram_gb * 1024
    execute_command("qm set #{vm_id} --cores #{cpu_cores} --memory #{ram_mb}", true)
    execute_command("qm set #{vm_id} --net0 virtio,bridge=#{bridge}", true)

    current_size = get_current_disk_size(vm_id)
    execute_command("qm resize #{vm_id} scsi0 #{storage_gb}G", true) if storage_gb > current_size

    begin
      Timeout.timeout(5) do
        execute_command("qm start #{vm_id}", true)
      end
    rescue Timeout::Error
      @logger.warn('qm start timeout')
    end
  end

  def get_current_disk_size(vm_id)
    config = execute_command("qm config #{vm_id}")
    if config.match(/scsi0:.*size=(\d+)G/)
      ::Regexp.last_match(1).to_i
    else
      0
    end
  end

  def get_vm_mac_address(vm_id)
    config = execute_command("qm config #{vm_id}")
    if (match = config.match(/net0:.*macaddr=([a-fA-F0-9:]{17})/))
      match[1]
    elsif (match = config.match(/net0:.*virtio=([a-fA-F0-9:]{17})/))
      match[1]
    else
      raise "Could not find MAC address for VM #{vm_id}"
    end
  end

  def wait_for_vm_ready(vm_id)
    30.times do
      status = execute_command("qm status #{vm_id}")
      if status.include?('running')
        sleep 5
        return true
      end
      sleep 2
    end
    false
  end

  def discover_and_bind_vm_ip(vm_id, mac_address, hostname)
    30.times do |_attempt|
      begin
        result = execute_command("pvesh get /nodes/#{PROXMOX_NODE}/qemu/#{vm_id}/agent/network-get-interfaces --output-format json")
        network_data = JSON.parse(result)
        interfaces = network_data['result'] || network_data['data'] || []

        interfaces.each do |interface|
          next unless interface['hardware-address'].to_s.downcase == mac_address.downcase

          interface['ip-addresses']&.each do |ip_info|
            next unless ip_info['ip-address-type'] == 'ipv4' && !ip_info['ip-address'].start_with?('127.')

            ip = ip_info['ip-address']
            setup_dhcp_reservation(hostname, mac_address, ip)
            return ip
          end
        end
      rescue StandardError => e
        @logger.debug("Guest agent query failed: #{e.message}")
      end
      sleep 5
    end
    raise "Could not discover IP for VM #{vm_id}"
  end

  def setup_dhcp_reservation(hostname, mac_address, ip_address)
    dhcp_file = '/etc/dnsmasq.d/windows-hosts.conf'
    if File.exist?(dhcp_file)
      content = File.read(dhcp_file)
      return if content.include?(mac_address) || content.include?(ip_address)
    end

    File.open(dhcp_file, 'a') do |f|
      f.puts "dhcp-host=#{mac_address},#{hostname},#{ip_address}"
    end

    system('systemctl reload dnsmasq') if system('systemctl is-active --quiet dnsmasq')
  end

  def create_inventory(vm_id, ip_address, template_config, username, password)
    is_windows = template_config[:connection][:type] == 'winrm'
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
  def build_extra_vars(vm_id:, hostname:, management_type:, os_template:, root_password:, rdp_password:, whitelist_ip:,
                       proxy_params: {})
    vars = {
      vm_id: vm_id,
      hostname: hostname,
      management_type: management_type,
      os_template: os_template,
      root_password: root_password,
      rdp_password: rdp_password,
      api_url: ENV.fetch('APP_URL', "http://#{PUBLIC_IP}:3000"),
      api_key: ENV.fetch('VM_CALLBACK_API_KEY', 'internal-provisioning-key')
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

  def run_ansible_playbook_with_validation(inventory_path, playbook_path, extra_vars)
    cmd = [
      'ansible-playbook',
      '-i', inventory_path,
      playbook_path,
      '-e', extra_vars.to_json
    ]

    @logger.info("Running Ansible: #{cmd.join(' ')}")
    stdout, stderr, status = Open3.capture3(*cmd)

    { success: status.success?, stdout: stdout, stderr: stderr }
  end
end

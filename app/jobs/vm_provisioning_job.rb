# frozen_string_literal: true

class VmProvisioningJob < ApplicationJob
  queue_as :default


  def perform(vm_id, params = {})
    vm = Vm.find_by(id: vm_id)
    unless vm
      logger.error "[VmProvisioningJob] VM #{vm_id} not found. Safe retry may be handled by adapter."
      return
    end

    logger.info "[VmProvisioningJob] Starting provisioning for VM #{vm_id}"

    vm.start_provisioning! if vm.may_start_provisioning?

    service = VmProvisioningService.new(nil, logger)
    
    # Merge existing metadata with any overrides from params
    # Ensure nested keys like proxy_config are preserved if not provided in params
    provision_params = {
      'db_vm_id' => vm.id,
      'os_template' => vm.vm_order&.os_type,
      'vm_type' => vm.vm_type,
      'cpu_cores' => vm.vm_order&.cpu_cores,
      'ram_gb' => vm.vm_order&.ram_gb,
      'storage_gb' => vm.vm_order&.disk_gb,
      'hostname' => vm.hostname,
      'management_type' => vm.vm_type.to_s.include?('managed') ? 'managed' : 'unmanaged',
      'country_code' => vm.vm_order&.order&.metadata&.dig('country_code'),
      'whitelist_ip' => params['whitelist_ip'],
      'root_password' => params['root_password'] || vm.root_password,
      'proxy_ip' => params['proxy_ip'],
      'proxy_port' => params['proxy_port'],
      'proxy_username' => params['proxy_username'],
      'proxy_password' => params['proxy_password'],
      'proxy_protocol' => params['proxy_protocol'] || 'http'
    }.merge(params.stringify_keys)

    logger.info "[VmProvisioningJob] Executing VmProvisioningService for VM #{vm_id} with hostname: #{provision_params['hostname']}"
    result = service.provision(provision_params)
    
    logger.info "[VmProvisioningJob] Provisioning service returned: #{result[:status]} (IP: #{result[:ip_address]})"

    # Update VM with results including credentials
    vm.update!(
      proxmox_vm_id: result[:pve_vmid].to_s,
      proxmox_node: VmProvisioningService::PROXMOX_NODE,
      ip_address: result[:ip_address],
      rdp_port: result[:protocol] == 'rdp' ? result[:port] : nil,
      ssh_port: result[:protocol] == 'ssh' ? result[:port] : nil,
      ssh_username: result[:username] || vm.hostname,
      ssh_password: result[:password],
      root_password: result[:root_password] || result[:password],
      hostname: result[:hostname],
      api_response: result.to_json
    )

    vm.mark_active!

    # Clear status cache
    Rails.cache.delete("vm_status_#{vm_id}")

    # Send credentials email
    logger.info "[VmProvisioningJob] VM #{vm_id} provisioned successfully"

    # Get owner from VM order (order.orderable is polymorphic - User or Reseller)
    owner = vm.vm_order&.order&.orderable
    if owner
      target_email = vm.vm_order&.order&.metadata&.dig('credentials_email').presence
      VmMailer.with(owner: owner, vm: vm, target_email: target_email).credentials_email.deliver_later

      if owner.is_a?(Reseller)
        payload = {
          order_id: vm.vm_order.order_id,
          vm_id: vm.id,
          ip_address: vm.ip_address,
          status: 'active',
          credentials: {
            username: vm.ssh_username,
            password: vm.root_password,
            port: vm.rdp_port || vm.ssh_port
          }
        }
        WebhookDispatchWorker.perform_later(owner.id, 'credentials.ready', payload)
      end
      
      NotificationService.notify(
        recipient: owner,
        category: 'success',
        title: 'VM Provisioned',
        message: "Your VM ##{vm.proxmox_vm_id || vm.hostname} is ready.",
        metadata: { vm_id: vm.id, ip_address: vm.ip_address }
      )
    end
  rescue AASM::InvalidTransition => e
    logger.error "[VmProvisioningJob] Invalid state transition: #{e.message}"
    raise e
  rescue StandardError => e
    logger.error "[VmProvisioningJob] Provisioning failed for VM #{vm_id}: #{e.message}"

    vm.fail! if vm.may_fail?

    # Notify failure
    owner = vm&.vm_order&.order&.orderable
    if owner
      id_label = vm.proxmox_vm_id.presence || vm.hostname.presence || vm.id # Fallback to UUID only as last resort
      NotificationService.notify(
        recipient: owner,
        category: 'error',
        title: 'VM Provisioning Failed',
        message: "VM ##{id_label} provisioning failed. Manual retry required.",
        metadata: { vm_id: vm.id, pve_vmid: vm.proxmox_vm_id, error: e.message }
      )
    end
  end
end

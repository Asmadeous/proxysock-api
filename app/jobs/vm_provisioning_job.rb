# frozen_string_literal: true

class VmProvisioningJob < ApplicationJob
  queue_as :default

  retry_on StandardError, wait: 5.seconds, attempts: 3

  def perform(vm_id, params = {})
    vm = Vm.find(vm_id)

    logger.info "[VmProvisioningJob] Starting provisioning for VM #{vm_id}"

    vm.start_provisioning! if vm.may_start_provisioning?

    service = VmProvisioningService.new(nil, logger)

    # Merge VM order data with params
    provision_params = {
      'job_id' => "vm-#{vm_id}-#{Time.now.to_i}",
      'os_template' => vm.vm_order.os_type,
      'vm_type' => vm.vm_type,
      'cpu_cores' => vm.vm_order.cpu_cores,
      'ram_gb' => vm.vm_order.ram_gb,
      'storage_gb' => vm.vm_order.disk_gb,
      'hostname' => "vm-#{vm_id}",
      'management_type' => params['management_type'] || 'unmanaged'
    }.merge(params.stringify_keys)

    result = service.provision(provision_params)

    # Update VM with results including credentials
    vm.update!(
      ip_address: result[:ip_address],
      proxmox_vm_id: result[:vm_id].to_s,
      proxmox_node: VmProvisioningService::PROXMOX_NODE,
      rdp_port: result[:external_port],
      ssh_port: result[:protocol] == 'ssh' ? result[:external_port] : 22,
      ssh_username: result[:username] || 'root',
      ssh_password: result[:password],
      root_password: result[:root_password] || result[:password],
      api_response: result.to_json
    )

    vm.mark_active!

    # Invalidate cache
    Rails.cache.delete("vm_status_#{vm_id}")

    # Send credentials email
    logger.info "[VmProvisioningJob] VM #{vm_id} provisioned successfully"

    # Get owner from VM order (order.orderable is polymorphic - User or Reseller)
    owner = vm.vm_order&.order&.orderable
    if owner
      VmMailer.with(owner: owner, vm: vm).credentials_email.deliver_later 
      NotificationService.notify(
        recipient: owner,
        category: 'success',
        title: 'VM Provisioned',
        message: "VM #{vm.ip_address} is ready.",
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
    owner = vm.vm_order&.order&.orderable
    if owner
      NotificationService.notify(
        recipient: owner,
        category: 'error',
        title: 'VM Provisioning Failed',
        message: "VM ##{vm.id} provisioning failed. Retrying...",
        metadata: { vm_id: vm.id, error: e.message }
      )
    end

    # Re-raise to trigger retry
    raise e
  end
end

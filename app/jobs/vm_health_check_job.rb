# frozen_string_literal: true

class VmHealthCheckJob < ApplicationJob
  queue_as :default

  # Checks all active VMs are reachable via ping/SSH
  # Scheduled via sidekiq-cron every 30 minutes
  def perform
    active_vms = Vm.where(status: 'active').where.not(ip_address: [nil, ''])
    checked = 0
    failed = 0

    active_vms.find_each do |vm|
      checked += 1
      hypervisor_status = check_hypervisor_status(vm)

      # If hypervisor status is known and not running, it's 'down'
      if hypervisor_status && hypervisor_status != 'running'
        failed += 1
        handle_failure(vm, 'down', "Hypervisor status: #{hypervisor_status}")
        next
      end

      # If hypervisor confirms it's running (or we can't check hypervisor), check network
      reachable = ping_vm(vm)

      if reachable
        vm.update_column(:last_health_check_at, Time.current) if vm.respond_to?(:last_health_check_at)
        recovered = vm.metadata&.dig('alerted')
        update_metadata(vm, 'healthy')
        notify_admins_about_recovery(vm) if recovered
      else
        failed += 1
        handle_failure(vm, 'unreachable', 'Network/SSH unreachable')
      end
    end
    logger.info "[VmHealthCheckJob] Completed: #{checked} checked, #{failed} failed."
  end

  private

  def check_hypervisor_status(vm)
    return nil if vm.proxmox_node.blank? || vm.proxmox_vm_id.blank?

    status_data = ProxmoxApiClient.get_vm_status(vm.proxmox_node, vm.proxmox_vm_id)
    status_data&.dig('status') # 'running', 'stopped', 'paused'
  end

  def handle_failure(vm, status, reason)
    update_metadata(vm, status)

    # Notify admins if VM has been problematic for 2+ consecutive checks
    consecutive_failures = (vm.metadata&.dig('consecutive_failures') || 0) + 1
    vm.metadata ||= {}
    vm.metadata['consecutive_failures'] = consecutive_failures
    vm.metadata['failure_reason'] = reason
    vm.update_column(:metadata, vm.metadata)

    # Alert once, on the second failure in a row, not on every check after it.
    return unless consecutive_failures >= 2 && !vm.metadata['alerted']

    notify_admins_about_unhealthy_vm(vm, consecutive_failures, status, reason)
    vm.metadata['alerted'] = true
    vm.update_column(:metadata, vm.metadata)
  end

  def ping_vm(vm)
    # Quick ICMP ping (2 second timeout, 2 pings)
    result = system('ping', '-c', '2', '-W', '2', vm.ip_address.to_s, out: File::NULL, err: File::NULL)

    # If ping fails, try the port customers log in on: the RDP port, or with none the SSH port.
    result ||= tcp_check(vm.ip_address, vm.login_details[:port])

    result
  end

  def tcp_check(ip, port)
    Socket.tcp(ip, port, connect_timeout: 3) { true }
  rescue Errno::ECONNREFUSED, Errno::ETIMEDOUT, Errno::EHOSTUNREACH, SocketError, Errno::ENETUNREACH
    false
  end

  def update_metadata(vm, status)
    vm.metadata ||= {}
    vm.metadata['health_status'] = status
    vm.metadata['last_health_check'] = Time.current.iso8601
    vm.metadata.merge!('consecutive_failures' => 0, 'alerted' => false) if status == 'healthy'
    vm.update_column(:metadata, vm.metadata)
  end

  def notify_admins_about_recovery(vm)
    Employee.where(active: true).find_each do |employee|
      NotificationService.notify(
        recipient: employee,
        category: 'success',
        title: 'VM Health: Recovered',
        message: "VM #{vm.ip_address} (ID: #{vm.id.to_s[0..7]}) is reachable again.",
        metadata: { vm_id: vm.id, ip: vm.ip_address, status: 'healthy' }
      )
    end
  end

  def notify_admins_about_unhealthy_vm(vm, consecutive_failures, status, reason)
    Employee.where(active: true).find_each do |employee|
      NotificationService.notify(
        recipient: employee,
        category: 'error',
        title: "VM Health Alert: #{status.capitalize}",
        message: "VM #{vm.ip_address} (ID: #{vm.id.to_s[0..7]}) is #{status}. Reason: #{reason}. Total failures: #{consecutive_failures}.",
        metadata: { vm_id: vm.id, ip: vm.ip_address, failures: consecutive_failures, status: status, reason: reason }
      )
    end
  end
end

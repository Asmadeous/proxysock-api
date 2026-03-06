# frozen_string_literal: true

class VmHealthCheckJob < ApplicationJob
  queue_as :default

  # Checks all active VMs are reachable via ping/SSH
  # Scheduled via sidekiq-cron every 30 minutes
  def perform
    logger.info '[VmHealthCheck] Starting health check for active VMs'

    active_vms = Vm.where(status: 'active').where.not(ip_address: [nil, ''])
    checked = 0
    failed = 0

    active_vms.find_each do |vm|
      reachable = ping_vm(vm)
      checked += 1

      if reachable
        vm.update_column(:last_health_check_at, Time.current) if vm.respond_to?(:last_health_check_at)
        update_metadata(vm, 'healthy')
      else
        failed += 1
        update_metadata(vm, 'unreachable')

        logger.warn "[VmHealthCheck] VM #{vm.id} (#{vm.ip_address}) is unreachable"

        # Notify admins if VM has been unreachable for 2+ consecutive checks
        consecutive_failures = (vm.metadata&.dig('consecutive_failures') || 0) + 1
        vm.metadata ||= {}
        vm.metadata['consecutive_failures'] = consecutive_failures
        vm.save!

        notify_admins_about_unhealthy_vm(vm, consecutive_failures) if consecutive_failures >= 2
      end
    end

    logger.info "[VmHealthCheck] Completed: #{checked} checked, #{failed} unreachable"
  end

  private

  def ping_vm(vm)
    # Quick ICMP ping (2 second timeout, 2 pings)
    result = system('ping', '-c', '2', '-W', '2', vm.ip_address.to_s, out: File::NULL, err: File::NULL)

    # If ping fails, try TCP connect to SSH/RDP port as fallback
    unless result
      port = vm.metadata&.dig('vm_type') == 'rdp' ? (vm.rdp_port || 3389) : (vm.ssh_port || 22)
      result = tcp_check(vm.ip_address, port)
    end

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
    vm.metadata['consecutive_failures'] = 0 if status == 'healthy'
    vm.save!
  end

  def notify_admins_about_unhealthy_vm(vm, consecutive_failures)
    Employee.where(active: true).find_each do |employee|
      NotificationService.notify(
        recipient: employee,
        category: 'error',
        title: 'VM Unreachable',
        message: "VM #{vm.ip_address} (ID: #{vm.id.to_s[0..7]}) has been unreachable for #{consecutive_failures} consecutive checks.",
        metadata: { vm_id: vm.id, ip: vm.ip_address, failures: consecutive_failures }
      )
    end
  end
end

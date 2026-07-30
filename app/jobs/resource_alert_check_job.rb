# frozen_string_literal: true

class ResourceAlertCheckJob < ApplicationJob
  queue_as :default

  def perform
    Rails.logger.info('Starting ResourceAlertCheckJob')

    # 1. Check Proxmox Server
    check_proxmox_server

    # 2. Check all VMs
    check_vms
  rescue StandardError => e
    Rails.logger.error("ResourceAlertCheckJob failed: #{e.message}")
  end

  private

  def check_proxmox_server
    node = ENV['PROXMOX_NODE'] || 'pve'
    svc = VmProvisioningService.new(nil, Rails.logger)

    # Fetch status
    status = svc.send(:proxmox_get, "/nodes/#{node}/status")['data']
    return unless status

    cpu_usage = status['cpu'] ? (status['cpu'] * 100).round(1) : 0
    memory_pct = status['memory'] && status['memory']['total'].positive? ? ((status['memory']['used'].to_f / status['memory']['total']) * 100).round(1) : 0

    evaluate_threshold('proxmox_server', node, 'cpu', cpu_usage, resource_name: node)
    evaluate_threshold('proxmox_server', node, 'memory', memory_pct, resource_name: node)

    # Fetch storage
    storage = svc.send(:proxmox_get, "/nodes/#{node}/storage")['data'] || []
    storage.each do |s|
      next unless s['active'] == 1 && s['total']&.positive?

      usage_pct = ((s['used'].to_f / s['total']) * 100).round(1)
      evaluate_threshold('proxmox_server', node, 'storage', usage_pct, resource_name: "#{node} - #{s['storage']}")
    end
  rescue StandardError => e
    Rails.logger.error("check_proxmox_server failed: #{e.message}")
  end

  def check_vms
    node = ENV['PROXMOX_NODE'] || 'pve'
    vms_data = ProxmoxApiClient.list_vms(node)

    return if vms_data.empty?

    # Get mapping of proxmox_vm_id to our DB VM to resolve ownership
    active_vmid_to_vm = Vm.where(status: 'active').index_by(&:proxmox_vm_id)

    vms_data.each do |vm_data|
      next unless vm_data['status'] == 'running'

      vmid = vm_data['vmid'].to_s
      vm = active_vmid_to_vm[vmid]
      next unless vm # Skip VMs not in our DB or not active

      # Calculate percentages
      cpu_usage = vm_data['cpu'] ? (vm_data['cpu'] * 100).round(1) : 0
      mem_pct = vm_data['maxmem']&.positive? ? ((vm_data['mem'].to_f / vm_data['maxmem']) * 100).round(1) : 0
      disk_pct = vm_data['maxdisk']&.positive? ? ((vm_data['disk'].to_f / vm_data['maxdisk']) * 100).round(1) : 0

      # Resolve ownership for emails
      recipient_data = resolve_ownership(vm)

      evaluate_threshold('vm', vmid, 'cpu', cpu_usage, resource_name: vm.hostname || "VM #{vmid}", recipient_data: recipient_data)
      evaluate_threshold('vm', vmid, 'memory', mem_pct, resource_name: vm.hostname || "VM #{vmid}", recipient_data: recipient_data)
      evaluate_threshold('vm', vmid, 'disk', disk_pct, resource_name: vm.hostname || "VM #{vmid}", recipient_data: recipient_data)
    end
  rescue StandardError => e
    Rails.logger.error("check_vms failed: #{e.message}")
  end

  def evaluate_threshold(resource_type, resource_id, metric, value, threshold: 90.0, resource_name: nil, recipient_data: nil)
    is_exceeding = value >= threshold

    if is_exceeding
      handle_exceeding_threshold(resource_type, resource_id, metric, value, threshold, resource_name, recipient_data)
    else
      handle_resolved_threshold(resource_type, resource_id, metric, value, threshold, resource_name, recipient_data)
    end
  end

  def handle_exceeding_threshold(resource_type, resource_id, metric, value, threshold, resource_name, recipient_data)
    # Check if we recently alerted
    return if ResourceAlert.in_cooldown?(resource_type, resource_id, metric)

    # Find or create active alert
    alert = ResourceAlert.find_or_create_firing(
      resource_type: resource_type,
      resource_id: resource_id,
      metric: metric,
      value: value,
      threshold: threshold,
      resource_name: resource_name
    )

    # Update recipient info
    recipient_data ||= default_admin_recipient
    alert.update!(
      recipient_email: recipient_data[:email],
      recipient_type: recipient_data[:type],
      recipient_id: recipient_data[:id],
      notified_at: Time.current
    )
    # Email notification for resource spikes removed — the alert is still tracked
    # (firing state + cooldown), we just no longer send an email.
  end

  def handle_resolved_threshold(resource_type, resource_id, metric, _value, _threshold, _resource_name, _recipient_data)
    # Find the active firing alert and resolve it. Email notification for resources
    # falling back under threshold removed — no email is sent.
    alert = ResourceAlert.firing.find_by(resource_type: resource_type, resource_id: resource_id, metric: metric)
    return unless alert

    alert.resolve!
  end

  def resolve_ownership(vm)
    order = vm.vm_order&.order
    return default_admin_recipient unless order

    orderable = order.orderable

    if orderable.is_a?(User)
      if orderable.owner_type == 'platform'
        { type: 'user', email: orderable.email, id: orderable.id, name: orderable.first_name || orderable.email }
      elsif orderable.owner_type == 'reseller_managed'
        reseller = orderable.reseller
        if reseller
          { type: 'reseller', email: reseller.email, id: reseller.id, name: reseller.company_name || reseller.email }
        else
          { type: 'user', email: orderable.email, id: orderable.id, name: orderable.first_name }
        end
      else
        { type: 'user', email: orderable.email, id: orderable.id, name: orderable.first_name }
      end
    elsif orderable.is_a?(Reseller)
      { type: 'reseller', email: orderable.email, id: orderable.id, name: orderable.company_name || orderable.email }
    else
      default_admin_recipient
    end
  end

  def default_admin_recipient
    # The default alert recipient comes from env or AdminMailer default
    email = ENV['ADMIN_ALERT_EMAIL'] || ENV['MAILER_FROM'] || 'admin@proxysock.com'
    { type: 'admin', email: email, id: nil, name: 'Admin' }
  end
end

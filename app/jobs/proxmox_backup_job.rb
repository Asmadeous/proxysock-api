# frozen_string_literal: true

class ProxmoxBackupJob < ApplicationJob
  queue_as :default

  # Back up every VM on the Proxmox node using vzdump.
  # Scheduled via cron every 3 days (see lib/tasks/backup.rake).
  #
  # Backup storage defaults to ENV['PROXMOX_BACKUP_STORAGE'] (e.g. "local", "nfs-backup").
  # Retention keeps the latest N backups per VM (ENV['PROXMOX_BACKUP_KEEP_LAST'], default 3).
  def perform
    node = ENV.fetch('PROXMOX_NODE', 'pve')
    storage = ENV.fetch('PROXMOX_BACKUP_STORAGE', 'local')
    keep_last = ENV.fetch('PROXMOX_BACKUP_KEEP_LAST', '3')
    compress = ENV.fetch('PROXMOX_BACKUP_COMPRESS', 'zstd')
    mode = ENV.fetch('PROXMOX_BACKUP_MODE', 'snapshot') # snapshot | suspend | stop
    mailto = ENV.fetch('PROXMOX_BACKUP_MAILTO', 'root@pam')

    logger.info "[ProxmoxBackupJob] Starting full backup — node=#{node}, storage=#{storage}, mode=#{mode}"

    # Get list of all running/stopped VMs (QEMU) on the node
    vm_ids = fetch_vm_ids(node)

    if vm_ids.empty?
      logger.info "[ProxmoxBackupJob] No VMs found on node #{node}, nothing to back up."
      return
    end

    logger.info "[ProxmoxBackupJob] Found #{vm_ids.length} VMs: #{vm_ids.join(', ')}"

    # Run vzdump for all VMs in one shot via API
    vmid_list = vm_ids.join(',')
    params = {
      vmid: vmid_list,
      storage: storage,
      compress: compress,
      mode: mode,
      'prune-backups': "keep-last=#{keep_last}",
      mailto: mailto,
      'notes-template': 'auto-backup-{{guestname}}-{{vmid}}'
    }

    logger.info "[ProxmoxBackupJob] Triggering backup via API on node #{node} for VMs: #{vmid_list}"
    upid = ProxmoxApiClient.trigger_backup(node, params)

    if upid
      logger.info "[ProxmoxBackupJob] Backup task started successfully via API. UPID: #{upid}"
      record_backup_result(vm_ids, 'success', "Task UPID: #{upid}")

      # Notify admins
      Employee.where(active: true).find_each do |employee|
        NotificationService.notify(
          recipient: employee,
          category: 'system_alert',
          title: 'Proxmox Backup Completed',
          message: "Automatic backup of #{vm_ids.length} VMs completed successfully.",
          metadata: { vm_ids: vm_ids, storage: storage, timestamp: Time.current.iso8601 }
        )
      end
    else
      error_msg = "Failed to trigger backup via API for node #{node}"
      logger.error "[ProxmoxBackupJob] #{error_msg}"

      record_backup_result(vm_ids, 'failed', error_msg)

      Employee.where(active: true).find_each do |employee|
        NotificationService.notify(
          recipient: employee,
          category: 'error',
          title: 'Proxmox Backup Failed',
          message: "Automatic backup failed: #{error_msg}",
          metadata: { vm_ids: vm_ids, error: error_msg, timestamp: Time.current.iso8601 }
        )
      end
    end
  rescue StandardError => e
    logger.error "[ProxmoxBackupJob] Unexpected error: #{e.message}"
    logger.error e.backtrace.join("\n")
    raise e
  end

  private

  def fetch_vm_ids(node)
    vms = ProxmoxApiClient.list_vms(node)
    return [] if vms.empty?

    vms.map { |vm| vm['vmid'].to_s }.sort
  end

  def record_backup_result(vm_ids, status, error = nil)
    # Store backup record in proxmox_operations for audit trail
    vm_ids.each do |vmid|
      vm = Vm.find_by(proxmox_vm_id: vmid.to_s)
      next unless vm

      ProxmoxOperation.create(
        vm: vm,
        operation_type: 'backup',
        proxmox_vm_id: vmid.to_s,
        proxmox_node: ENV.fetch('PROXMOX_NODE', 'pve'),
        status: status,
        error_message: error&.truncate(1000),
        request_params: { storage: ENV.fetch('PROXMOX_BACKUP_STORAGE', 'local'), timestamp: Time.current.iso8601 },
        response_data: { vm_count: vm_ids.length }
      )
    end
  end
end

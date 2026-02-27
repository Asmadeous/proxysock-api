# frozen_string_literal: true

namespace :proxmox do
  desc 'Run a full backup of all Proxmox VMs (called by cron every 3 days)'
  task backup: :environment do
    ProxmoxBackupJob.perform_later
    puts "[#{Time.current}] ProxmoxBackupJob enqueued"
  end
end

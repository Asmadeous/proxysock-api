# frozen_string_literal: true

class Vm < ApplicationRecord
  belongs_to :vm_order, optional: true

  has_one :order, through: :vm_order
  has_many :proxmox_operations, dependent: :destroy

  include AASM

  aasm column: :status do
    state :pending, initial: true
    state :provisioning
    state :active
    state :failed
    state :terminated

    event :start_provisioning do
      transitions from: %i[pending failed], to: :provisioning
    end

    event :mark_active do
      transitions from: :provisioning, to: :active
    end

    event :fail do
      transitions from: %i[pending provisioning], to: :failed
    end

    event :terminate do
      transitions from: %i[active failed provisioning], to: :terminated
    end
  end

  def can_renew?
    # Only active VMs can be renewed
    active?
  end

  def renew!(duration_days = 30)
    # For VMs, renewal just means extending the database expiry date.
    # Proxmox doesn't auto-kill; our cleanup job checks this DB expiry.
    new_expiry = (expires_at || Time.current) + duration_days.days
    update!(expires_at: new_expiry)
  end

  def provision!
    start_provisioning!

    service = VmProvisioningService.new(nil, Rails.logger)

    # Map attributes to service params
    params = {
      'job_id' => "vm-#{id}-#{Time.now.to_i}", # Unique job ID
      'os_template' => vm_order.os_type, # Assuming VmOrder has os_type
      'vm_type' => vm_type, # Vm has vm_type
      'cpu_cores' => vm_order.cpu_cores,
      'ram_gb' => vm_order.ram_gb,
      'storage_gb' => vm_order.disk_gb,
      'hostname' => "vm-#{id}",            # Simple hostname strategy
      'management_type' => 'unmanaged'     # Default or derived
    }

    begin
      result = service.provision(params)

      update!(
        ip_address: result[:ip_address],
        proxmox_vm_id: result[:vm_id].to_s,
        rdp_port: result[:protocol] == 'rdp' ? 3389 : nil,
        ssh_port: result[:protocol] == 'ssh' ? 22 : nil,
        expires_at: 30.days.from_now # Set initial expiry
      )

      mark_active!
    rescue StandardError => e
      Rails.logger.error("VM Provisioning failed: #{e.message}")
      fail!
      raise e
    end
  end

  def terminate!
    service = VmProvisioningService.new(nil, Rails.logger)
    service.cleanup_vm(proxmox_vm_id, ip_address, "vm-#{id}")
    terminate
  end
end

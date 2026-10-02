# frozen_string_literal: true

class Vm < ApplicationRecord
  belongs_to :vm_order, optional: true

  has_one :order, through: :vm_order
  has_many :proxmox_operations, dependent: :destroy
  has_many :ip_addresses, foreign_key: 'vm_id'

  validates :ip_address, uniqueness: true, allow_nil: true
  validates :private_ip_address, uniqueness: true, allow_nil: true

  include AASM

  aasm column: :status do
    state :pending, initial: true
    state :provisioning
    state :active
    state :failed
    state :expired
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

    event :terminate, after: :cleanup_vm_on_proxmox do
      transitions from: %i[active failed provisioning expired], to: :terminated
    end

    event :expire, after: :stop_vm_on_proxmox do
      transitions from: :active, to: :expired
    end
  end

  # The address customers connect to. Always the assigned Cloudflare URL
  # (hostname.<base_domain>), never the raw IP. We prefer the stored dns_name,
  # and reconstruct the Cloudflare FQDN from the hostname if it wasn't persisted.
  # Only falls back to the IP when there is no hostname at all.
  def connection_host
    return dns_name if dns_name.present?

    base = ENV['CLOUDFLARE_BASE_DOMAIN'].to_s.strip.delete("\"'")
    base = 'proxysock.com' if base.blank?
    hostname.present? ? "#{hostname}.#{base}" : ip_address
  end

  # How the customer logs in, the same values the customer's own order page shows:
  # the Cloudflare host, the login, and the RDP port or (with no RDP port) the SSH port.
  def login_details
    rdp = rdp_port.present? || vm_type == 'rdp'
    {
      host: connection_host,
      ip_address: ip_address,
      protocol: rdp ? 'rdp' : 'ssh',
      username: ssh_username.presence || rdp_username.presence || 'root',
      password: root_password.presence || ssh_password.presence || rdp_password_encrypted,
      port: rdp ? (rdp_port || 3389) : (ssh_port || 22),
      ssh_port: rdp_port.present? ? ssh_port : (ssh_port || 22),
      rdp_port: rdp_port || (vm_type == 'rdp' ? 3389 : nil)
    }
  end

  # Days in one paid period: the order's duration_days (30 for monthly plans).
  def period_days
    days = order&.metadata&.dig('duration_days').to_i
    days.positive? ? days : 30
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

    management_type = vm_type.to_s.include?('managed') ? 'managed' : 'unmanaged'

    params = {
      'job_id' => "vm-#{id}-#{Time.now.to_i}",
      'os_template' => vm_order.os_type,
      'vm_type' => vm_type,
      'cpu_cores' => vm_order.cpu_cores,
      'ram_gb' => vm_order.ram_gb,
      'storage_gb' => vm_order.disk_gb,
      'management_type' => management_type,
      'root_password' => service.generate_secure_password
    }

    begin
      result = service.provision(params)

      # Update VM record with successful provisioning details
      update!(
        ip_address: result[:ip_address],
        hostname: result[:hostname],
        dns_name: result[:dns_name],
        proxmox_vm_id: result[:vm_id].to_s,
        rdp_port: result[:protocol] == 'rdp' ? result[:port] : nil,
        ssh_port: result[:protocol] == 'ssh' ? result[:port] : nil,
        ssh_username: result[:username],
        ssh_password: result[:password],
        root_password: result[:password],
        provisioned_at: Time.current,
        expires_at: Time.current + 30.days
      )

      mark_active!
      # Send welcome email with credentials and custom ports
      VmMailer.credentials_email(self).deliver_later
    rescue StandardError => e
      Rails.logger.error("VM Provisioning failed: #{e.message}")
      fail!
      raise e
    end
  end

  private

  def stop_vm_on_proxmox
    service = VmProvisioningService.new(nil, Rails.logger)
    service.stop_vm(proxmox_vm_id)
  end

  def cleanup_vm_on_proxmox
    service = VmProvisioningService.new(nil, Rails.logger)
    service.cleanup_vm(proxmox_vm_id, ip_address, "vm-#{id}")
  end
end

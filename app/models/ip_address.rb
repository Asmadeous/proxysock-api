# frozen_string_literal: true

class IpAddress < ApplicationRecord
  scope :available, -> { where(status: 'available').or(where(status: nil)) }

  def self.claim_next_available(vm_id)
    # Use row-level locking to prevent race conditions during high-concurrency provisioning
    ip = available.lock('FOR UPDATE SKIP LOCKED').first
    return nil unless ip

    ip.update!(
      status: 'assigned',
      vm_id: vm_id,
      assigned_at: Time.current
    )
    ip
  end

  def release!
    update!(status: 'available', vm_id: nil, assigned_at: nil)
  end
end

# frozen_string_literal: true

class IpAddress < ApplicationRecord
  scope :available, -> { where(status: 'available').or(where(status: nil)) }

  def self.claim_next_available(vm_id)
    # Use row-level locking to prevent race conditions during high-concurrency provisioning
    ip = nil
    
    transaction do
      # Find available candidates
      candidates = available.lock('FOR UPDATE SKIP LOCKED').limit(20)
      
      # Belt and suspenders: ensure the IP isn't currently assigned to any VM record
      # (handles cases where a VM record was left with an IP after a failure)
      ip = candidates.find do |cand|
        !Vm.where(ip_address: cand.address).exists?
      end
      
      if ip
        ip.update!(
          status: 'assigned',
          vm_id: vm_id,
          assigned_at: Time.current
        )
      end
    end
    ip
  end

  def release!
    # Ensure no VM record is still pointing to this IP
    Vm.where(ip_address: address).update_all(ip_address: nil)
    update!(status: 'available', vm_id: nil, assigned_at: nil)
  end

end

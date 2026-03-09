# frozen_string_literal: true

class ProxyAssignment < ApplicationRecord
  belongs_to :order
  belongs_to :proxy_instance
  belongs_to :user, optional: true

  validates :username, :password, presence: true

  scope :active, -> { where(status: 'active') }
  scope :expired, -> { where(status: 'expired') }

  def expired?
    (expires_at.present? && expires_at < Time.current) || 
    (gb_limit.present? && gb_used >= gb_limit)
  end

  def disconnect!
    update!(status: 'expired')
    # If this was the only active assignment for the proxy, mark proxy as available
    # In a multicredential setup, we might wait until all assignments for that instance expire
    # For XProxy mobile, usually it's 1:1 or managed users.
    # Logic from Supabase script: update proxy status to available if needed
    proxy_instance.update!(status: 'available')
  end
end

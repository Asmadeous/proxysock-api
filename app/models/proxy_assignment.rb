# frozen_string_literal: true

class ProxyAssignment < ApplicationRecord
  belongs_to :order
  belongs_to :proxy_instance
  belongs_to :user, optional: true

  validates :username, :password, presence: true

  scope :active,   -> { where(status: 'active') }
  scope :expired,  -> { where(status: 'expired') }
  scope :gb_based, -> { where.not(gb_limit: nil) }

  # ──────────────────────────────────────────────────────────────────────────
  # Expiry checks
  # ──────────────────────────────────────────────────────────────────────────

  def time_expired?
    expires_at.present? && expires_at < Time.current
  end

  def gb_depleted?
    gb_limit.present? && gb_used >= gb_limit
  end

  def expired?
    time_expired? || gb_depleted?
  end

  def expiry_reason
    return :gb_depleted  if gb_depleted?
    return :time_expired if time_expired?

    nil
  end

  # ──────────────────────────────────────────────────────────────────────────
  # GB tracking
  # ──────────────────────────────────────────────────────────────────────────

  # Thread-safe atomic increment; returns true when limit is crossed for the
  # first time so the caller can immediately trigger disconnect.
  def record_usage!(gb_amount)
    return false unless gb_limit.present?

    was_under = !gb_depleted?
    increment!(:gb_used, gb_amount)
    reload
    was_under && gb_depleted? # true = just crossed the limit right now
  end

  # ──────────────────────────────────────────────────────────────────────────
  # Lifecycle
  # ──────────────────────────────────────────────────────────────────────────

  # Marks the assignment expired, frees the proxy if no other active
  # assignments share it, and optionally sends a notification email.
  # Does NOT call the XProxy API — the caller (XProxyService) is responsible
  # for that so that API logic stays in one place.
  def disconnect!(reason: expiry_reason, notify: true)
    return if status == 'expired'

    update!(
      status: 'expired',
      metadata: (metadata || {}).merge(
        'disconnected_at' => Time.current.iso8601,
        'disconnect_reason' => reason.to_s
      )
    )

    # Free the proxy only when this is the last active assignment on it
    remaining = proxy_instance.proxy_assignments.active.count
    proxy_instance.update!(status: 'available') if remaining.zero?

    send_expiry_notification(reason) if notify
  end

  private

  def send_expiry_notification(reason)
    owner = user || order.orderable
    return unless owner.respond_to?(:email) && owner.email.present?

    ProxyMailer.with(
      owner: owner,
      order: order,
      assignment: self,
      proxy: proxy_instance,
      reason: reason
    ).expiry_email.deliver_later
  rescue StandardError => e
    Rails.logger.error("[ProxyAssignment] Expiry email failed for #{id}: #{e.message}")
  end
end

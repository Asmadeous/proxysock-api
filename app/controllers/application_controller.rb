# frozen_string_literal: true

class ApplicationController < ActionController::API
  include ErrorHandling

  before_action :update_last_seen_at

  private

  def update_last_seen_at
    actor = if defined?(current_employee) && current_employee
              current_employee
            elsif defined?(current_user) && current_user
              current_user
            elsif defined?(current_reseller) && current_reseller
              current_reseller
            end

    return unless actor
    return if actor.has_attribute?(:last_seen_at) && actor.last_seen_at && actor.last_seen_at > 5.minutes.ago

    # Skip validation and callbacks to avoid overhead
    actor.update_column(:last_seen_at, Time.current) if actor.has_attribute?(:last_seen_at)
  end

  def record_audit_log(action, target, changes = nil)
    # Generic audit log recorder
    # Works for both User and Employee actions
    actor = if defined?(current_employee) && current_employee
              current_employee
            elsif defined?(current_user) && current_user
              current_user
            elsif defined?(current_reseller) && current_reseller
              current_reseller # If resellers can trigger audits
            else
              nil
            end

    return unless actor

    AuditLog.create!(
      user_id: actor.id,
      user_type: actor.class.name,
      action: action,
      auditable: target,
      ip_address: request.remote_ip,
      object_changes: changes || target.try(:saved_changes)
    )
  rescue StandardError => e
    Rails.logger.error "Audit Log Failed: #{e.message}"
  end
end

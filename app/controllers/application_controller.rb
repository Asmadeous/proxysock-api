class ApplicationController < ActionController::API
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
  rescue => e
    Rails.logger.error "Audit Log Failed: #{e.message}"
  end
end

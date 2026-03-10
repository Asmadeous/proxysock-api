# frozen_string_literal: true

class ApplicationController < ActionController::API
  # Order matters: standard error is catch-all
  rescue_from StandardError, with: :handle_standard_error
  rescue_from ActiveRecord::RecordNotFound, with: :handle_not_found
  rescue_from ActionController::ParameterMissing, with: :handle_bad_request

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

  def handle_standard_error(exception)
    # Report to Sentry
    Sentry.capture_exception(exception)

    # Generic response
    render json: {
      error: 'Internal Server Error',
      request_id: request.request_id
    }, status: :internal_server_error
  end

  def handle_not_found(exception)
    render json: {
      error: 'Not Found',
      message: exception.message # Safe to expose "Couldn't find X with id=Y" usually, or obscure it.
    }, status: :not_found
  end

  def handle_bad_request(exception)
    render json: {
      error: 'Bad Request',
      message: exception.message
    }, status: :bad_request
  end

  def redirect_to_frontend(path, options = {})
    frontend_url = ENV.fetch('FRONTEND_URL', 'http://localhost:3001')
    target = if path.start_with?('http')
               path
             else
               "#{frontend_url}#{path.start_with?('/') ? '' : '/'}#{path}"
             end

    # Validate host against allowed frontend URL
    begin
      target_uri = URI.parse(target)
      allowed_uri = URI.parse(frontend_url)

      if target_uri.host == allowed_uri.host && target_uri.port == allowed_uri.port
        redirect_to target, options.merge(allow_other_host: true)
      else
        Rails.logger.warn "Blocked unsafe redirect to: #{target}"
        render json: { error: 'Unsafe redirect blocked' }, status: :forbidden
      end
    rescue URI::InvalidURIError
      render json: { error: 'Invalid redirect URL' }, status: :bad_request
    end
  end
end

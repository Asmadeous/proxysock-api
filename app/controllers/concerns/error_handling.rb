# frozen_string_literal: true

module ErrorHandling
  extend ActiveSupport::Concern

  included do
    # Shared rescue logic
    rescue_from StandardError, with: :handle_standard_error
    rescue_from ActiveRecord::RecordNotFound, with: :handle_not_found
    rescue_from ActiveRecord::RecordInvalid, with: :handle_record_invalid
    rescue_from ActionController::ParameterMissing, with: :handle_bad_request
  end

  private

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
      message: exception.message
    }, status: :not_found
  end

  def handle_bad_request(exception)
    render json: {
      error: 'Bad Request',
      message: exception.message
    }, status: :bad_request
  end

  def handle_record_invalid(exception)
    render json: {
      error: 'Validation Failed',
      message: exception.record.errors.full_messages.join(', '),
      errors: exception.record.errors
    }, status: :unprocessable_entity
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

      # In development, we might be flexible with ports if the host is localhost/127.0.0.1
      allowed_host = allowed_uri.host
      target_host = target_uri.host
      
      is_local = ['localhost', '127.0.0.1'].include?(target_host) && 
                 ['localhost', '127.0.0.1'].include?(allowed_host)

      is_valid_host = target_host == allowed_host || (Rails.env.development? && is_local)
      is_valid_port = target_uri.port == allowed_uri.port || (Rails.env.development? && is_local)

      if is_valid_host && is_valid_port
        redirect_to target, options.merge(allow_other_host: true)
      else
        Rails.logger.warn "Blocked unsafe redirect to: #{target} (Frontend URL: #{frontend_url})"
        render json: { error: 'Unsafe redirect blocked', target: target }, status: :forbidden
      end
    rescue URI::InvalidURIError => e
      Rails.logger.error "Invalid redirect URL: #{target} - #{e.message}"
      render json: { error: 'Invalid redirect URL' }, status: :bad_request
    end
  end
end

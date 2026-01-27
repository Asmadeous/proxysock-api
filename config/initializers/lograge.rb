Rails.application.configure do
  config.lograge.enabled = true
  config.lograge.formatter = Lograge::Formatters::Json.new

  # Add custom data to the log event
  config.lograge.custom_options = lambda do |event|
    payload = {
      time: Time.current.iso8601,
      request_id: event.payload[:request_id],
      remote_ip: event.payload[:remote_ip],
      user_agent: event.payload[:user_agent],
      params: event.payload[:params].except('controller', 'action', 'format'),
    }

    # Add user_id if present (devise/warden)
    # payload[:user_id] = event.payload[:user_id] if event.payload[:user_id]
    
    # Add exception details if present
    if event.payload[:exception]
      payload[:exception] = event.payload[:exception]
      payload[:exception_message] = event.payload[:exception_object]&.message
      payload[:exception_backtrace] = event.payload[:exception_object]&.backtrace&.first(5)
    end

    payload
  end

  # Log params even if Lograge usually suppresses them
  config.lograge.custom_payload do |controller|
    {
      request_id: controller.request.uuid,
      user_id: controller.current_user.try(:id),
      remote_ip: controller.request.remote_ip,
      user_agent: controller.request.user_agent,
      params: controller.request.filtered_parameters
    }
  end
end

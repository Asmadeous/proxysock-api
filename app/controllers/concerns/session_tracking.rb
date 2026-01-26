module SessionTracking
  extend ActiveSupport::Concern

  included do
    before_action :track_session
    helper_method :current_session
  end

  def current_session
    @current_session
  end

  private

  def track_session
    # Skip tracking for API calls unless specific web/public endpoints
    return if request.path.start_with?('/api/v1') # Reseller API usually stateless/token based
    
    session_id = session[:session_id] || SecureRandom.hex(16)
    session[:session_id] = session_id

    @current_session = UserSession.find_or_create_by(session_id: session_id) do |s|
      s.user = current_user if defined?(current_user) && current_user
      s.ip_address = request.remote_ip
      s.user_agent = request.user_agent
      s.started_at = Time.current
      # GeoIP lookup would go here
    end
    
    # Update last activity
    if @current_session.persisted?
      @current_session.update_columns(last_activity_at: Time.current)
      
      # Link user if logged in during session
      if defined?(current_user) && current_user && @current_session.user.nil?
        @current_session.update(user: current_user)
      end
    end
  end
end

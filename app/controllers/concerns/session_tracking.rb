module SessionTracking
  extend ActiveSupport::Concern

  included do
    before_action :track_session
    helper_method :current_session if respond_to?(:helper_method)
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
      
      end
    end
  end
  
  def track_page_view
    return if request.path.start_with?('/api/v1')
    
    # Increment PageAnalytics
    # Optimized: Update counters in Redis or DB directly (Upsert)
    # For now, simple DB upsert
    today = Date.current
    path = request.path
    
    # Using raw SQL or efficient find_or_create for speed
    # Ideally async job but direct for simplicity here
    page_stat = PageAnalytics.find_or_initialize_by(date: today, page_url: path)
    page_stat.views = (page_stat.views || 0) + 1
    page_stat.unique_visitors = UserSession.where(started_at: today.beginning_of_day..today.end_of_day).count # Approximation
    page_stat.save
    
    # If product page, track ProductAnalytics
    if params[:controller] == 'web/api/products' && params[:action] == 'show' && params[:id]
      track_product_view(params[:id])
    end
  end
  
  def track_product_view(product_id)
    today = Date.current
    prod_stat = ProductAnalytics.find_or_initialize_by(date: today, product_id: product_id)
    prod_stat.views = (prod_stat.views || 0) + 1
    prod_stat.save
  end

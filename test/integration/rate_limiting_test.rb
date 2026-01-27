require 'test_helper'

class RateLimitingTest < ActionDispatch::IntegrationTest
  def setup
    # Enable Rack::Attack for this test suite
    Rack::Attack.enabled = true
    Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new
  end

  def teardown
    Rack::Attack.enabled = false
  end

  test 'throttle excessive requests by IP' do
    ip = '1.2.3.4'
    limit = 60
    
    # Send requests up to limit
    limit.times do
      get '/up', headers: { 'REMOTE_ADDR' => ip }
      assert_response :success
    end

    # Next request should be throttled
    get '/up', headers: { 'REMOTE_ADDR' => ip }
    assert_response :too_many_requests
    assert_equal 'application/json', response.media_type
    assert_match /Throttle limit reached/, response.body
  end

  test 'localhost is safelisted' do
    ip = '127.0.0.1'
    limit = 65 # Over the limit
    
    limit.times do
      get '/up', headers: { 'REMOTE_ADDR' => ip }
      assert_response :success
    end
  end

  test 'throttle login attempts' do
    ip = '10.0.0.1'
    limit = 5
    
    # We need a route that matches the throttle definition
    # Using a fake route helper or raw path
    path = '/api/v1/auth/token'

    limit.times do
      post path, params: { }, headers: { 'REMOTE_ADDR' => ip }
      # It might 404 or 401 controller-wise but Rack middleware runs first
      # We just want to ensure it passes the throttle
      # Since we don't have full auth setup here, we assume if it hits controller it's success (or at least NOT 429)
      assert_response :unauthorized # Expected 401 from controller
    end

    # Next one blocks
    post path, params: { }, headers: { 'REMOTE_ADDR' => ip }
    assert_response :too_many_requests
  end
end

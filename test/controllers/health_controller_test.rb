require 'test_helper'

class HealthControllerTest < ActionDispatch::IntegrationTest
  test 'should return valid health response' do
    get health_url
    
    # We expect either 200 OK or 503 Service Unavailable depending on local Redis/DB state
    assert_includes [200, 503], response.status

    json_response = JSON.parse(response.body)
    
    # Check structure
    assert_includes ['ok', 'error'], json_response['status']
    assert json_response.key?('details')
    
    # Details should contain component status
    assert json_response['details'].key?('database')
    assert json_response['details'].key?('redis')
    assert json_response['details'].key?('timestamp')
  end
end

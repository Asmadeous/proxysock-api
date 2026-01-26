require "test_helper"

class ProxySyncServiceTest < ActiveSupport::TestCase
  test "syncs proxies from provider" do
    # Mock external API client
    mock_client = Minitest::Mock.new
    mock_client.expect :fetch_proxies, [
      {
        "ip" => "1.2.3.4",
        "port" => 8080,
        "username" => "user",
        "password" => "pass",
        "type" => "mobile",
        "country" => "US"
      }
    ]
    
    MyProxyApiClient.stub :new, mock_client do
      assert_difference "MobileProxy.count", 1 do
        ProxySyncService.new.sync!
      end
    end
    
    proxy = MobileProxy.last
    assert_equal "1.2.3.4", proxy.ip_address
    assert_equal "US", proxy.country
  end
  
  test "updates existing proxies" do
    # Create existing proxy
    proxy = MobileProxy.create!(
      ip_address: "1.2.3.4",
      port: 8080,
      username: "old_user",
      password: "old_pass",
      status: "available",
      proxy_source: "myproxyapi"
    )
    
    mock_client = Minitest::Mock.new
    mock_client.expect :fetch_proxies, [
      {
        "ip" => "1.2.3.4",
        "port" => 8080,
        "username" => "new_user",
        "password" => "new_pass",
        "type" => "mobile",
        "country" => "US"
      }
    ]
    
    MyProxyApiClient.stub :new, mock_client do
      assert_no_difference "MobileProxy.count" do
        ProxySyncService.new.sync!
      end
    end
    
    proxy.reload
    assert_equal "new_user", proxy.username
  end
end

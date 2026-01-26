require "test_helper"

class Api::V1::AuthControllerTest < ActionDispatch::IntegrationTest
  setup do
    @reseller = resellers(:reseller_one)
    # Create wallet for reseller
    Wallet.create!(owner: @reseller, balance: 100.0) unless @reseller.wallet
  end

  test "should get token with valid credentials" do
    post "/api/v1/auth/token", params: {
      email: @reseller.email,
      password: "password123"
    }
    
    assert_response :success
    assert_not_nil json_response["token"]
    assert_not_nil json_response["refresh_token"]
  end

  test "should fail with invalid credentials" do
    post "/api/v1/auth/token", params: {
      email: @reseller.email,
      password: "wrongpassword"
    }
    
    assert_response :unauthorized
  end

  test "should refresh token with valid refresh token" do
    # First get a token
    post "/api/v1/auth/token", params: {
      email: @reseller.email,
      password: "password123"
    }
    
    refresh_token = json_response["refresh_token"]
    
    post "/api/v1/auth/refresh", params: {
      refresh_token: refresh_token
    }
    
    assert_response :success
    assert_not_nil json_response["token"]
  end

  test "should reject invalid refresh token" do
    post "/api/v1/auth/refresh", params: {
      refresh_token: "invalid-token"
    }
    
    assert_response :unauthorized
  end
end

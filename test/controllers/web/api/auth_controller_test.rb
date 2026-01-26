require "test_helper"

class Web::Api::AuthControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:user_one)
  end

  test "should login with valid credentials" do
    post "/web/api/auth/login", params: {
      email: @user.email,
      password: "password123"
    }
    
    assert_response :success
    assert_not_nil json_response["token"]
    assert_not_nil json_response["user"]
  end

  test "should fail login with invalid credentials" do
    post "/web/api/auth/login", params: {
      email: @user.email,
      password: "wrongpassword"
    }
    
    assert_response :unauthorized
  end

  test "should register new user" do
    assert_difference "User.count", 1 do
      post "/web/api/auth/register", params: {
        first_name: "New",
        last_name: "User",
        email: "newuser@example.com",
        password: "password123",
        password_confirmation: "password123"
      }
    end
    
    assert_response :created
    assert_not_nil json_response["token"]
  end
end

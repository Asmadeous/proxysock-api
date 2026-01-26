require "test_helper"

class Web::Api::WalletsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:user_one)
    Wallet.find_or_create_by!(owner: @user) { |w| w.balance = 50.0 }
  end

  test "should get balance" do
    get "/web/api/wallet", headers: auth_header(@user)
    
    assert_response :success
    assert_equal "50.0", json_response["balance"]
  end

  test "should initiate deposit" do
    post "/web/api/wallet/deposit",
      params: { amount: 100.0, gateway: "paystack" },
      headers: auth_header(@user)
      
    assert_response :success
    assert_not_nil json_response["payment_url"]
  end

  test "should list transactions" do
    # Create a transaction
    @user.wallet.credit!(10.0, "Test", {})
    
    get "/web/api/wallet/transactions", headers: auth_header(@user)
    
    assert_response :success
    assert_not_empty json_response["transactions"]
  end
end

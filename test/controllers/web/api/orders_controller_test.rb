require "test_helper"

class Web::Api::OrdersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:user_one)
    Wallet.find_or_create_by!(owner: @user) { |w| w.balance = 100.0 }
    @user.wallet.update!(balance: 100.0)
    
    @proxy_product = products(:proxy_product)
  end

  test "should create order with wallet payment" do
    assert_difference "Order.count", 1 do
      post "/web/api/orders", 
        params: { 
          product_id: @proxy_product.id,
          payment_method: "wallet"
        },
        headers: auth_header(@user)
    end
    
    assert_response :created
    assert_equal "active", json_response["status"] # Proxies provision immediately if available
  end

  test "should fail if wallet balance insufficient" do
    @user.wallet.update!(balance: 0.0)
    
    post "/web/api/orders", 
      params: { 
        product_id: @proxy_product.id,
        payment_method: "wallet"
      },
      headers: auth_header(@user)
      
    assert_response :unprocessable_entity
    assert_match /Insufficient balance/, json_response["error"]
  end

  test "should create order with gateway payment" do
    # Gateway flow might return payment URL instead of active order
    post "/web/api/orders", 
      params: { 
        product_id: @proxy_product.id,
        payment_method: "paystack" # or gateway
      },
      headers: auth_header(@user)
      
    assert_response :accepted # or success depending on implementation
    assert json_response.key?("payment_url")
  end
end

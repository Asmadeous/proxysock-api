require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "should not save user without email" do
    user = User.new(first_name: "Test", last_name: "User", password_digest: "test")
    assert_not user.save, "Saved user without email"
  end

  test "should have unique email" do
    user1 = users(:user_one)
    user2 = User.new(
      first_name: "Another",
      last_name: "User",
      email: user1.email,
      password_digest: BCrypt::Password.create("password")
    )
    assert_not user2.save, "Saved user with duplicate email"
  end

  test "wallet association" do
    user = users(:user_one)
    assert user.respond_to?(:wallet)
  end

  test "orders association" do
    user = users(:user_one)
    assert user.respond_to?(:orders)
  end

  test "has many through pricing" do
    user = create_user_with_balance(50.0)
    assert_equal 50.0, user.wallet.balance
  end
end

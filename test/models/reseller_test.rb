require "test_helper"

class ResellerTest < ActiveSupport::TestCase
  test "should not save reseller without company name" do
    reseller = Reseller.new(email: "test@test.com", password_digest: "test")
    assert_not reseller.save, "Saved reseller without company name"
  end

  test "should have valid reseller_type" do
    reseller = resellers(:reseller_one)
    assert_includes %w[api_only hybrid], reseller.reseller_type
  end

  test "price_multiplier calculation" do
    reseller = resellers(:reseller_one)
    # 10% surcharge = 1.10 multiplier
    assert_equal 1.10, reseller.price_multiplier
  end

  test "api_only? method" do
    reseller = resellers(:reseller_api)
    assert reseller.api_only?
  end

  test "wallet association" do
    reseller = resellers(:reseller_one)
    assert reseller.respond_to?(:wallet)
  end

  test "balance method returns wallet balance" do
    reseller = create_reseller_with_balance(250.0)
    assert_equal 250.0, reseller.balance
  end

  test "rotating token fields" do
    reseller = resellers(:reseller_api)
    assert_not_nil reseller.current_token_jti
    assert_not_nil reseller.token_issued_at
  end
end

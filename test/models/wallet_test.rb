require "test_helper"

class WalletTest < ActiveSupport::TestCase
  test "should have owner" do
    wallet = wallets(:user_wallet)
    assert_not_nil wallet.owner
  end

  test "polymorphic owner - user" do
    wallet = wallets(:user_wallet)
    assert_equal "User", wallet.owner_type
  end

  test "polymorphic owner - reseller" do
    wallet = wallets(:reseller_wallet)
    assert_equal "Reseller", wallet.owner_type
  end

  test "credit increases balance" do
    wallet = Wallet.create!(owner: users(:user_one), balance: 100.0)
    wallet.credit!(50.0, "Test credit", {})
    wallet.reload
    assert_equal 150.0, wallet.balance
  end

  test "debit decreases balance" do
    wallet = Wallet.create!(owner: users(:user_two), balance: 100.0)
    wallet.debit!(30.0, "Test debit", {})
    wallet.reload
    assert_equal 70.0, wallet.balance
  end

  test "debit fails with insufficient balance" do
    wallet = Wallet.create!(owner: users(:user_one), balance: 50.0)
    assert_raises(StandardError) do
      wallet.debit!(100.0, "Overdraft attempt", {})
    end
  end

  test "transactions are created on credit" do
    wallet = Wallet.create!(owner: users(:user_two), balance: 0.0)
    assert_difference "WalletTransaction.count", 1 do
      wallet.credit!(25.0, "Test credit", {})
    end
  end

  test "transactions are created on debit" do
    wallet = Wallet.create!(owner: users(:user_one), balance: 100.0)
    assert_difference "WalletTransaction.count", 1 do
      wallet.debit!(25.0, "Test debit", {})
    end
  end
end

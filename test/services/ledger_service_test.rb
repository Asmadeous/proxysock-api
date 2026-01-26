require "test_helper"

class LedgerServiceTest < ActiveSupport::TestCase
  setup do
    @wallet = Wallet.create!(owner: users(:user_one), balance: 0.0)
  end

  test "records transaction with hash chaining" do
    service = LedgerService.new(@wallet)
    
    # First transaction
    txn1 = service.record_entry(100.0, :credit, "Deposit", {})
    
    assert_not_nil txn1.entry_hash
    assert_nil txn1.parent_hash # First entry has no parent? Or genesis hash.
    # Depending on implementation. If nil is allowed for first.
    
    # Second transaction
    txn2 = service.record_entry(50.0, :debit, "Payment", {})
    
    assert_not_nil txn2.entry_hash
    assert_equal txn1.entry_hash, txn2.parent_hash
  end

  test "verifies chain integrity" do
    service = LedgerService.new(@wallet)
    service.record_entry(100.0, :credit, "Deposit", {})
    service.record_entry(50.0, :debit, "Payment", {})
    
    assert service.verify_integrity
  end

  test "detects tampering" do
    service = LedgerService.new(@wallet)
    txn1 = service.record_entry(100.0, :credit, "Deposit", {})
    service.record_entry(50.0, :debit, "Payment", {})
    
    # Tamper with first transaction
    txn1.update_column(:amount, 999.0)
    
    assert_not service.verify_integrity
  end
end

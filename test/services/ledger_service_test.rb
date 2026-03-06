# frozen_string_literal: true

require 'test_helper'

class LedgerServiceTest < ActiveSupport::TestCase
  setup do
    @user = create_user_with_balance(0)
    @wallet = @user.wallets.find_by(wallet_type: 'main')
  end

  test 'records transaction with hash chaining' do
    service = LedgerService.new(@wallet)

    # First transaction
    txn_ref1 = Transaction.create!(transactable: @user, reference: @user, amount: 100.0, transaction_type: 'credit',
                                   status: 'success', currency: 'USD')
    txn1 = service.record_entry(100.0, :credit, 'Deposit', {}, txn_ref1)

    assert_not_nil txn1.entry_hash
    assert_equal 'GENESIS_HASH', txn1.parent_hash

    # Second transaction
    txn_ref2 = Transaction.create!(transactable: @user, reference: @user, amount: 50.0, transaction_type: 'debit',
                                   status: 'success', currency: 'USD')
    txn2 = service.record_entry(50.0, :debit, 'Payment', {}, txn_ref2)

    assert_not_nil txn2.entry_hash
    assert_equal txn1.entry_hash, txn2.parent_hash
  end

  test 'verifies chain integrity' do
    service = LedgerService.new(@wallet)
    txn_ref1 = Transaction.create!(transactable: @user, reference: @user, amount: 100.0, transaction_type: 'credit',
                                   status: 'success', currency: 'USD')
    service.record_entry(100.0, :credit, 'Deposit', {}, txn_ref1)

    txn_ref2 = Transaction.create!(transactable: @user, reference: @user, amount: 50.0, transaction_type: 'debit',
                                   status: 'success', currency: 'USD')
    service.record_entry(50.0, :debit, 'Payment', {}, txn_ref2)

    assert service.verify_integrity!
  end

  test 'detects tampering' do
    service = LedgerService.new(@wallet)
    txn_ref1 = Transaction.create!(transactable: @user, reference: @user, amount: 100.0, transaction_type: 'credit',
                                   status: 'success', currency: 'USD')
    txn1 = service.record_entry(100.0, :credit, 'Deposit', {}, txn_ref1)
    txn_ref2 = Transaction.create!(transactable: @user, reference: @user, amount: 50.0, transaction_type: 'debit',
                                   status: 'success', currency: 'USD')
    service.record_entry(50.0, :debit, 'Payment', {}, txn_ref2)

    # Tamper with first transaction
    txn1.update_column(:amount, 999.0)

    # verify_integrity! raises LedgerTamperError or returns false? Code raises Error.
    assert_raises(LedgerService::LedgerTamperError) do
      service.verify_integrity!
    end
  end
end

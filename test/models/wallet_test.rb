# frozen_string_literal: true

require 'test_helper'

class WalletTest < ActiveSupport::TestCase
  test 'should have owner' do
    wallet = wallets(:user_wallet)
    assert_not_nil wallet.owner
  end

  test 'polymorphic owner - user' do
    wallet = wallets(:user_wallet)
    assert_equal 'User', wallet.owner_type
  end

  test 'polymorphic owner - reseller' do
    wallet = wallets(:reseller_wallet)
    assert_equal 'Reseller', wallet.owner_type
  end

  test 'credit increases balance' do
    wallet = Wallet.create!(owner: users(:one))
    # Initial balance 0
    txn = Transaction.create!(transactable: users(:one), reference: users(:one), amount: 50.0, transaction_type: 'credit', status: 'success', currency: 'USD')
    wallet.credit!(50.0, 'Test credit', {}, txn)
    wallet.reload
    assert_equal 50.0, wallet.balance
  end

  test 'debit decreases balance' do
    wallet = Wallet.create!(owner: users(:one))
    txn = Transaction.create!(transactable: users(:one), reference: users(:one), amount: 100.0, transaction_type: 'credit', status: 'success', currency: 'USD', description: 'Init')
    wallet.credit!(100.0, 'Init', {}, txn)
    
    txn_d = Transaction.create!(transactable: users(:one), reference: users(:one), amount: 30.0, transaction_type: 'debit', status: 'success', currency: 'USD')
    wallet.debit!(30.0, 'Test debit', {}, txn_d)
    wallet.reload
    assert_equal 70.0, wallet.balance
  end

  test 'debit fails with insufficient balance' do
    wallet = Wallet.create!(owner: users(:one))
    txn = Transaction.create!(transactable: users(:one), reference: users(:one), amount: 50.0, transaction_type: 'credit', status: 'success', currency: 'USD', description: 'Init')
    wallet.credit!(50.0, 'Init', {}, txn)

    assert_raises(StandardError) do
      txn_d = Transaction.create!(transactable: users(:one), reference: users(:one), amount: 100.0, transaction_type: 'debit', status: 'success', currency: 'USD')
      wallet.debit!(100.0, 'Overdraft attempt', {}, txn_d)
    end
  end

  test 'transactions are created on credit' do
    wallet = Wallet.create!(owner: users(:two))
    assert_difference 'WalletTransaction.count', 1 do
      txn = Transaction.create!(transactable: users(:two), reference: users(:two), amount: 25.0, transaction_type: 'credit', status: 'success', currency: 'USD', description: 'Test credit')
      wallet.credit!(25.0, 'Test credit', {}, txn)
    end
  end

  test 'transactions are created on debit' do
    wallet = Wallet.create!(owner: users(:one))
    txn = Transaction.create!(transactable: users(:one), reference: users(:one), amount: 100.0, transaction_type: 'credit', status: 'success', currency: 'USD', description: 'Init')
    wallet.credit!(100.0, 'Init', {}, txn)

    assert_difference 'WalletTransaction.count', 1 do
      txn_d = Transaction.create!(transactable: users(:one), reference: users(:one), amount: 25.0, transaction_type: 'debit', status: 'success', currency: 'USD')
      wallet.debit!(25.0, 'Test debit', {}, txn_d)
    end
  end
end

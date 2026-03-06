# frozen_string_literal: true

require 'test_helper'

class WalletTest < ActiveSupport::TestCase
  setup do
    @user = create_user_with_balance(0)
    @wallet = @user.wallets.find_by(wallet_type: 'main')
  end

  test 'should have owner' do
    assert_not_nil @wallet.owner
  end

  test 'credit increases balance' do
    # Initial balance 0
    txn = Transaction.create!(transactable: @user, reference: @user, amount: 50.0, transaction_type: 'credit',
                              status: 'success', currency: 'USD')
    @wallet.credit!(50.0, 'Test credit', {}, txn)
    @wallet.reload
    assert_equal 50.0, @wallet.balance
  end

  test 'debit decreases balance' do
    txn = Transaction.create!(transactable: @user, reference: @user, amount: 100.0, transaction_type: 'credit',
                              status: 'success', currency: 'USD', description: 'Init')
    @wallet.credit!(100.0, 'Init', {}, txn)

    txn_d = Transaction.create!(transactable: @user, reference: @user, amount: 30.0, transaction_type: 'debit',
                                status: 'success', currency: 'USD')
    @wallet.debit!(30.0, 'Test debit', {}, txn_d)
    @wallet.reload
    assert_equal 70.0, @wallet.balance
  end

  test 'debit fails with insufficient balance' do
    txn = Transaction.create!(transactable: @user, reference: @user, amount: 50.0, transaction_type: 'credit',
                              status: 'success', currency: 'USD', description: 'Init')
    @wallet.credit!(50.0, 'Init', {}, txn)

    assert_raises(StandardError) do
      txn_d = Transaction.create!(transactable: @user, reference: @user, amount: 100.0, transaction_type: 'debit',
                                  status: 'success', currency: 'USD')
      @wallet.debit!(100.0, 'Overdraft attempt', {}, txn_d)
    end
  end

  test 'transactions are created on credit' do
    assert_difference 'WalletTransaction.count', 1 do
      txn = Transaction.create!(transactable: @user, reference: @user, amount: 25.0, transaction_type: 'credit',
                                status: 'success', currency: 'USD', description: 'Test credit')
      @wallet.credit!(25.0, 'Test credit', {}, txn)
    end
  end

  test 'transactions are created on debit' do
    txn = Transaction.create!(transactable: @user, reference: @user, amount: 100.0, transaction_type: 'credit',
                              status: 'success', currency: 'USD', description: 'Init')
    @wallet.credit!(100.0, 'Init', {}, txn)

    assert_difference 'WalletTransaction.count', 1 do
      txn_d = Transaction.create!(transactable: @user, reference: @user, amount: 25.0, transaction_type: 'debit',
                                  status: 'success', currency: 'USD')
      @wallet.debit!(25.0, 'Test debit', {}, txn_d)
    end
  end
end

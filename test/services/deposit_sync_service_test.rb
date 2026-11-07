# frozen_string_literal: true

require 'test_helper'

class DepositSyncServiceTest < ActiveSupport::TestCase
  setup do
    @user = create_user_with_balance(0)
    @deposit = Deposit.create!(depositable: @user, amount: 15, gateway: 'bachs', status: 'pending',
                               metadata: { 'transaction_ref' => 'DEPsync1', 'bachs_checkout_id' => 'chk_9' })
  end

  def bachs_checkout(status, amount = '15.00', paid: amount)
    { 'checkout_id' => 'chk_9', 'status' => status, 'amount' => amount, 'currency' => 'USD',
      'charge' => { 'amount' => amount, 'amount_paid' => paid, 'amount_remaining' => '0.00', 'currency' => 'USD' } }
  end

  test 'leaves an unpaid or expired Bachs checkout pending without opening a ticket' do
    TicketCreatorService.expects(:create_for_failed_deposit).never

    %w[open expired].each do |status|
      BachsService.any_instance.stubs(:checkout).with('chk_9').returns(bachs_checkout(status))

      assert_not DepositSyncService.new(@deposit).sync!
      assert_equal 'pending', @deposit.reload.status
    end
  end

  test 'credits a completed Bachs checkout once' do
    BachsService.any_instance.stubs(:checkout).returns(bachs_checkout('completed'))

    assert DepositSyncService.new(@deposit).sync!
    DepositSyncService.new(@deposit.reload).sync!

    assert_equal 'completed', @deposit.reload.status
    assert_in_delta 15.0, @user.wallet.reload.balance
  end

  test 'does not credit a completed Bachs checkout that was paid short' do
    BachsService.any_instance.stubs(:checkout).returns(bachs_checkout('completed', paid: '9.00'))
    TicketCreatorService.expects(:create_for_failed_deposit).once

    assert_not DepositSyncService.new(@deposit).sync!
    assert_equal 'failed', @deposit.reload.status
    assert_in_delta 0.0, @user.wallet.reload.balance
  end
end

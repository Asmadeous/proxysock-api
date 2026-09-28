# frozen_string_literal: true

require 'test_helper'

class EsimTopupRenewalJobTest < ActiveJob::TestCase
  test 'renews only live subscriptions that are due' do
    user = create_user_with_balance(0)
    order = orders(:one)
    due = EsimTopupSubscription.create!(order: order, orderable: user, topup_value: 10, price: 15,
                                        next_charge_at: 1.minute.ago)
    due.cancel!
    live_due = EsimTopupSubscription.create!(order: order, orderable: user, topup_value: 10, price: 15,
                                             next_charge_at: 1.minute.ago)
    EsimTopupSubscription.create!(order: orders(:two), orderable: user, topup_value: 10, price: 15,
                                  next_charge_at: 1.day.from_now)

    EsimTopupService.expects(:renew!).with(live_due).once

    EsimTopupRenewalJob.perform_now
  end
end

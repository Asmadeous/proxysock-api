# frozen_string_literal: true

namespace :deposits do
  desc 'Sync pending deposits with payment gateways'
  task sync_pending: :environment do
    pending_deposits = Deposit.where(status: 'pending')
    puts "Found #{pending_deposits.count} pending deposits to check..."

    success_count = 0
    pending_deposits.find_each do |deposit|
      success_count += 1 if DepositSyncService.new(deposit).sync!
    end

    puts "Sync complete. Updated #{success_count} deposits."
  end
end

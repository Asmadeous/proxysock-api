# frozen_string_literal: true

class ProcessCapitalPayoutsJob < ApplicationJob
  queue_as :default

  # This job runs periodically (e.g. daily via sidekiq-cron)
  # It gathers all pending order fund splits, sums the capital amounts,
  # and makes a withdrawal to the static Capital Wallet via Heleket.
  def perform
    wallet_address = ENV['HELEKET_CAPITAL_WALLET_ADDRESS']
    
    if wallet_address.blank?
      Rails.logger.error("[ProcessCapitalPayoutsJob] Aborting: HELEKET_CAPITAL_WALLET_ADDRESS is not set in environment.")
      return
    end

    pending_splits = OrderFundSplit.where(status: 'pending').lock("FOR UPDATE SKIP LOCKED")
    
    return if pending_splits.empty?

    total_capital = pending_splits.sum(:capital_amount)
    
    # Do not initiate tiny payouts below the typical network fee or minimum withdrawal limits
    if total_capital < 10.0
      Rails.logger.info("[ProcessCapitalPayoutsJob] Total pending capital (#{total_capital}) is too small for a payout. Deferring to next run.")
      return
    end

    begin
      Rails.logger.info("[ProcessCapitalPayoutsJob] Initiating payout of #{total_capital} USD to #{wallet_address}")
      
      # For Heleket Payout API: 'USDT' is typically the currency, but we assume Heleket routes ERC20
      # automatically based on wallet address format or account configuration.
      # Check Heleket docs if 'USDT-ERC20' or 'USDT.ERC20' is required as the currency code.
      # For now, we use 'USDT_ERC20' as an assumed format or just 'USDT' depending on provider.
      currency_code = ENV['HELEKET_PAYOUT_CURRENCY'] || 'USDT'

      heleket = HeleketService.new
      response = heleket.create_withdrawal(total_capital, currency_code, wallet_address)

      if response['error'].present?
        Rails.logger.error("[ProcessCapitalPayoutsJob] Payout failed: #{response['error']} - #{response['body']}")
      else
        # We assume success and update the records
        txn_id = response['uuid'] || response['id'] || response.dig('data', 'id')
        
        pending_splits.update_all(
          status: 'paid',
          payout_transaction_id: txn_id,
          paid_out_at: Time.current
        )
        
        Rails.logger.info("[ProcessCapitalPayoutsJob] Successfully paid out #{total_capital}. Txn ID: #{txn_id}")
      end
    rescue StandardError => e
      Rails.logger.error("[ProcessCapitalPayoutsJob] Exception during payout: #{e.message}")
    end
  end
end

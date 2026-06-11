# frozen_string_literal: true

class ProcessGatewaySweepsJob < ApplicationJob
  queue_as :default

  # Runs periodically to sweep crypto funds from checkout gateways (Plisio, Payvra)
  # into the main Heleket treasury wallet.
  def perform
    heleket_deposit_address = ENV['HELEKET_DEPOSIT_ADDRESS']
    
    if heleket_deposit_address.blank?
      Rails.logger.error("[ProcessGatewaySweepsJob] HELEKET_DEPOSIT_ADDRESS is not set. Cannot sweep funds.")
      return
    end

    sweep_currency = ENV['SWEEP_CURRENCY'] || 'USDT'

    sweep_plisio(heleket_deposit_address, sweep_currency)
  end

  private

  def sweep_plisio(address, currency)
    plisio = PlisioService.new
    balances_response = plisio.balances(currency)
    
    if balances_response['status'] == 'success'
      # The response for /balances/<currency> returns the specific currency balance
      balance = balances_response.dig('data', 'balance').to_f
      
      if balance > 10.0 # Minimum sweep threshold
        Rails.logger.info("[ProcessGatewaySweepsJob] Sweeping #{balance} #{currency} from Plisio to #{address}")
        
        withdraw_response = plisio.withdraw(balance, currency, address, "sweep-#{Time.current.to_i}")
        if withdraw_response['status'] == 'success' || withdraw_response['status'] == 'pending'
          Rails.logger.info("[ProcessGatewaySweepsJob] Plisio sweep successful: #{withdraw_response}")
        else
          Rails.logger.error("[ProcessGatewaySweepsJob] Plisio sweep failed: #{withdraw_response}")
        end
      end
    else
      Rails.logger.error("[ProcessGatewaySweepsJob] Failed to get Plisio balances: #{balances_response}")
    end
  rescue StandardError => e
    Rails.logger.error("[ProcessGatewaySweepsJob] Exception during Plisio sweep: #{e.message}")
  end
end

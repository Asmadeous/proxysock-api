# frozen_string_literal: true

class DepositSyncService
  def initialize(deposit)
    @deposit = deposit
    @gateway = deposit.gateway
  end

  def sync!
    return if @deposit.status != 'pending'

    verification = verify_with_gateway
    if verification[:status] == 'success'
      process_completion(verification[:amount])
      true
    else
      false
    end
  end

  private

  def verify_with_gateway
    case @gateway
    when 'paystack'
      PaystackService.new.verify_transaction(@deposit.metadata['transaction_ref'])
    when 'plisio'
      PlisioService.new.verify_transaction(@deposit.metadata['transaction_ref'])
    when 'payvra'
      # Payvra needs its own ID usually. Checking if we saved it.
      invoice_id = @deposit.metadata['payvra_invoice_id'] || @deposit.metadata['transaction_ref']
      PayvraService.new.verify_transaction(invoice_id)
    else
      { status: 'unsupported' }
    end
  end

  def process_completion(paid_amount)
    ActiveRecord::Base.transaction do
      @deposit.update!(status: 'completed', completed_at: Time.current)

      @deposit.depositable&.wallet&.credit!(paid_amount, "Deposit sync via #{@gateway}", {
        gateway: @gateway,
        synced_at: Time.current,
        paid_amount: paid_amount
      })
      
      Rails.logger.info("Successfully synced deposit #{@deposit.id} (#{@deposit.metadata['transaction_ref']})")
    end
  end
end

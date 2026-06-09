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
      handle_deposit_failure(verification[:error] || "Payment verification returned status: #{verification[:status]}")
      false
    end
  rescue StandardError => e
    handle_deposit_failure("Gateway error: #{e.message}")
    false
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
    when 'heleket'
      invoice_id = @deposit.metadata['heleket_invoice_id'] || @deposit.metadata['transaction_ref']
      HeleketService.new.verify_transaction(invoice_id)
    when 'hundredpay'
      # 100Pay uses charge_id for verification. We might have stored it in metadata or use transaction_ref
      charge_id = @deposit.metadata['hundredpay_charge_id'] || @deposit.metadata['transaction_ref']
      HundredpayService.new.verify_transaction(charge_id)
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

  def handle_deposit_failure(error_message)
    Rails.logger.error("[DepositSyncService] Deposit #{@deposit.id} failed: #{error_message}")

    # Update deposit status to failed if possible
    @deposit.update(status: 'failed') if @deposit.respond_to?(:status)

    # Auto-create a support ticket and sync to Tawk.to
    TicketCreatorService.create_for_failed_deposit(@deposit, error_message)

    # Notify the depositor
    if @deposit.depositable
      NotificationService.notify(
        recipient: @deposit.depositable,
        category: 'error',
        title: 'Deposit Failed',
        message: "Your deposit via #{@gateway} could not be processed. A support ticket has been created.",
        metadata: { deposit_id: @deposit.id }
      )
    end

    # Slack: Deposit failure alert
    SlackNotifyJob.perform_later('deposit_failed', @deposit.id, error: error_message)
  end
end

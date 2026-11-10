# frozen_string_literal: true

class DepositSyncService
  def initialize(deposit)
    @deposit = deposit
    @gateway = deposit.gateway
  end

  def sync!
    return if @deposit.status != 'pending'

    verification = verify_with_gateway
    # Not paid yet: leave the deposit pending so a later payment can still credit it.
    return false if verification[:status] == 'pending'

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
    when 'plisio'
      PlisioService.new.verify_transaction(@deposit.metadata['transaction_ref'])
    when 'heleket'
      invoice_id = @deposit.metadata['heleket_invoice_id'] || @deposit.metadata['transaction_ref']
      HeleketService.new.verify_transaction(invoice_id)
    when 'hundredpay'
      # 100Pay uses charge_id for verification. We might have stored it in metadata or use transaction_ref
      charge_id = @deposit.metadata['hundredpay_charge_id'] || @deposit.metadata['transaction_ref']
      HundredpayService.new.verify_transaction(charge_id)
    when 'bachs'
      verify_with_bachs
    else
      { status: 'unsupported' }
    end
  end

  def verify_with_bachs
    checkout = BachsService.new.checkout(@deposit.metadata['bachs_checkout_id'])
    case checkout['status']
    when 'completed'
      return { status: 'failed', error: "Bachs checkout paid in #{checkout['currency']}" } unless checkout['currency'] == 'USD'

      owed = BachsService.amount_owed(checkout)
      if owed.positive?
        return { status: 'failed', error: "Bachs payment is short by #{owed.to_s('F')} #{checkout.dig('charge', 'currency')}" }
      end

      { status: 'success', amount: [checkout['amount'].to_f, @deposit.amount.to_f].min }
    # A bank transfer sent before expiry can still complete an expired checkout.
    when 'open', 'expired' then { status: 'pending' }
    else { status: checkout['status'], error: "Bachs checkout is #{checkout['status']}" }
    end
  end

  # Locked and re-checked: the Bachs webhook may credit the same deposit at the same time.
  def process_completion(paid_amount)
    @deposit.with_lock do
      next unless @deposit.status == 'pending'

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

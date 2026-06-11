# frozen_string_literal: true

# Orchestrates withdrawal from a reseller's earnings wallet via payment gateways.
# Only available for infrastructure resellers who earn commissions.
#
# Payout routing:
#   - crypto (plisio): Automatically dispatched to the gateway
#   - non-crypto (paystack/hundredpay/manual): Creates a pending payout and
#     notifies admin for manual processing with account details
class PayoutService
  class InsufficientBalanceError < StandardError; end
  class InvalidGatewayError < StandardError; end
  class PayoutError < StandardError; end

  MINIMUM_PAYOUT = 50 # Minimum withdrawal amount in USD

  # Gateways that are automatically dispatched to crypto providers
  CRYPTO_GATEWAYS = %w[plisio heleket].freeze

  # Gateways that require manual admin processing
  MANUAL_GATEWAYS = %w[paystack hundredpay manual].freeze

  def initialize(reseller)
    @reseller = reseller
  end

  def withdraw!(amount:, gateway:, payment_details: {})
    validate!(amount, gateway)

    payout = nil

    ActiveRecord::Base.transaction do
      # Debit the earnings wallet
      earnings_wallet = @reseller.earnings_wallet
      raise InsufficientBalanceError, 'No earnings wallet found' unless earnings_wallet
      raise InsufficientBalanceError, "Insufficient earnings balance (#{earnings_wallet.balance} < #{amount})" if earnings_wallet.balance < amount

      # Debit first, then create payout to ensure wallet consistency
      earnings_wallet.debit!(
        amount,
        "Payout withdrawal via #{gateway}",
        { gateway: gateway, payment_details: payment_details }
      )

      initial_status = CRYPTO_GATEWAYS.include?(gateway) ? 'processing' : 'pending'

      payout = Payout.create!(
        reseller: @reseller,
        amount: amount,
        gateway: gateway,
        status: initial_status,
        payment_details: payment_details
      )
    end

    if CRYPTO_GATEWAYS.include?(gateway)
      # Dispatch crypto payouts automatically
      dispatch_to_gateway!(payout)
    else
      # Non-crypto: notify admin for manual processing
      notify_admin_for_manual_payout!(payout)
    end

    payout
  rescue InsufficientBalanceError, InvalidGatewayError => e
    raise e
  rescue StandardError => e
    Rails.logger.error("PayoutService Error: #{e.message}")
    # If payout was created but gateway dispatch failed, mark it as failed
    # and refund the earnings wallet
    if payout&.persisted? && payout.status != 'completed'
      payout.mark_failed!({ error: e.message })
      refund_earnings!(payout)
    end
    raise PayoutError, "Payout failed: #{e.message}"
  end

  private

  def validate!(amount, gateway)
    raise InvalidGatewayError, "Invalid gateway: #{gateway}" unless Payout::GATEWAYS.include?(gateway)
    raise InsufficientBalanceError, "Minimum payout is $#{MINIMUM_PAYOUT}" if amount < MINIMUM_PAYOUT
  end

  def dispatch_to_gateway!(payout)
    response = case payout.gateway
               when 'plisio'
                 dispatch_plisio(payout)
               when 'heleket'
                 dispatch_heleket(payout)
               end

    payout.update!(gateway_response: response || {})
  rescue StandardError => e
    Rails.logger.error("Gateway dispatch failed for payout #{payout.id}: #{e.message}")
    payout.mark_failed!({ error: e.message })
    refund_earnings!(payout)
    raise
  end

  def notify_admin_for_manual_payout!(payout)
    AdminMailer.payout_request(payout).deliver_later
    Rails.logger.info("Admin notified for manual payout #{payout.reference} — $#{payout.amount} via #{payout.gateway}")
  rescue StandardError => e
    # Don't fail the payout if email delivery fails — payout is already pending in DB
    Rails.logger.error("Failed to notify admin for payout #{payout.id}: #{e.message}")
  end

  def refund_earnings!(payout)
    earnings_wallet = @reseller.earnings_wallet
    return unless earnings_wallet

    earnings_wallet.credit!(
      payout.amount,
      "Refund for failed payout #{payout.reference}",
      { payout_id: payout.id }
    )
    Rails.logger.info("Refunded $#{payout.amount} to earnings wallet for failed payout #{payout.reference}")
  rescue StandardError => e
    Rails.logger.error("CRITICAL: Failed to refund earnings for payout #{payout.id}: #{e.message}")
  end

  def dispatch_plisio(payout)
    service = PlisioService.new
    address = payout.payment_details['crypto_address']
    currency = payout.payment_details['crypto_currency'] || 'USDT'
    raise PayoutError, 'Plisio payouts require a crypto_address in payment_details' if address.blank?

    service.withdraw(
      payout.amount,
      currency,
      address,
      payout.reference
    )
  end

  def dispatch_heleket(payout)
    service = HeleketService.new
    address = payout.payment_details['crypto_address']
    currency = payout.payment_details['crypto_currency'] || 'USDT'
    raise PayoutError, 'Heleket payouts require a crypto_address in payment_details' if address.blank?

    service.create_withdrawal(
      payout.amount,
      currency,
      address
    )
  end
end

# frozen_string_literal: true

# Orchestrates withdrawal from a reseller's earnings wallet via payment gateways.
# Only available for infrastructure resellers who earn commissions.
class PayoutService
  class InsufficientBalanceError < StandardError; end
  class InvalidGatewayError < StandardError; end
  class PayoutError < StandardError; end

  MINIMUM_PAYOUT = 50 # Minimum withdrawal amount in USD

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

      payout = Payout.create!(
        reseller: @reseller,
        amount: amount,
        gateway: gateway,
        status: 'processing',
        payment_details: payment_details
      )
    end

    # Dispatch to gateway (outside transaction — if gateway fails, payout stays in 'processing')
    dispatch_to_gateway!(payout)

    payout
  rescue InsufficientBalanceError, InvalidGatewayError => e
    raise e
  rescue StandardError => e
    Rails.logger.error("PayoutService Error: #{e.message}")
    # If payout was created but gateway dispatch failed, mark it as failed
    payout&.mark_failed!({ error: e.message })
    raise PayoutError, "Payout failed: #{e.message}"
  end

  private

  def validate!(amount, gateway)
    raise InvalidGatewayError, "Invalid gateway: #{gateway}" unless Payout::GATEWAYS.include?(gateway)
    raise InsufficientBalanceError, "Minimum payout is $#{MINIMUM_PAYOUT}" if amount < MINIMUM_PAYOUT
  end

  def dispatch_to_gateway!(payout)
    response = case payout.gateway
               when 'paystack'
                 dispatch_paystack(payout)
               when 'plisio'
                 dispatch_plisio(payout)
               when 'payvra'
                 dispatch_payvra(payout)
               when 'hundredpay'
                 # HundredPay doesn't have a payout API yet — mark as pending for manual processing
                 { status: 'pending_manual', message: 'HundredPay payouts require manual processing' }
               end

    payout.update!(gateway_response: response || {})

    if response&.dig(:status) == 'pending_manual'
      payout.update!(status: 'pending')
    end
  rescue StandardError => e
    Rails.logger.error("Gateway dispatch failed for payout #{payout.id}: #{e.message}")
    payout.mark_failed!({ error: e.message })
    raise
  end

  def dispatch_paystack(payout)
    service = PaystackService.new
    # Paystack requires a recipient_code (bank account recipient) in payment_details
    recipient_code = payout.payment_details['recipient_code']
    raise PayoutError, 'Paystack payouts require a recipient_code in payment_details' if recipient_code.blank?

    service.initiate_transfer(
      payout.amount,
      recipient_code,
      payout.reference
    )
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

  def dispatch_payvra(payout)
    service = PayvraService.new
    address = payout.payment_details['crypto_address']
    currency = payout.payment_details['crypto_currency'] || 'USDT'
    raise PayoutError, 'Payvra payouts require a crypto_address in payment_details' if address.blank?

    service.create_withdrawal(
      payout.amount,
      currency,
      address
    )
  end
end

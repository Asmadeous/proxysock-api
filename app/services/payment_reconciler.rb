# frozen_string_literal: true

# Single source of truth for turning a confirmed gateway payment into its effect
# (credit a deposit, provision an order, complete a checkout session).
#
# Both entry points feed into this:
#   - WebhooksController — when the gateway calls back / the payer is redirected
#   - RexpaySweepJob     — the fallback poller, for payments whose callback never arrived
#
# `data` must already represent a CONFIRMED-successful payment: callers verify
# server-side (getTransactionStatus / signature) before reconciling.
class PaymentReconciler
  def self.reconcile(data, gateway)
    new.reconcile(data, gateway)
  end

  def reconcile(data, gateway)
    reference = data['reference'] || data[:reference] || data['order_number'] || data[:order_number]
    return unless reference

    metadata = data['metadata'] || data[:metadata] || {}

    # Prefixes are matched without a trailing `_` so both the current
    # alphanumeric references (CHECKOUT…/DEP…/ORD…, required by RexPay) and the
    # legacy underscore form (CHECKOUT_…/DEP_…/ORD_…, still emitted to the crypto
    # gateways) route correctly.
    if reference.to_s.start_with?('CHECKOUT')
      handle_checkout_session(reference, data, gateway, metadata)
    elsif reference.to_s.start_with?('DEP')
      handle_deposit(reference, data, gateway)
    elsif reference.to_s.start_with?('ORD') || metadata['type'] == 'order'
      handle_order_payment(reference, data, gateway, metadata)
    else
      handle_deposit(reference, data, gateway)
    end
  end

  private

  def handle_deposit(reference, data, gateway)
    deposit = Deposit.where("metadata->>'transaction_ref' = ?", reference).first
    return unless deposit && deposit.status == 'pending'

    # Normalise the paid amount to USD.
    paid_amount_usd =
      case gateway
      when 'rexpay'
        # RexPay charges NGN grossed up for fees. Convert the paid NGN back to USD
        # but never credit more than the intended deposit — the fee is the
        # customer's cost, not wallet balance.
        rate = deposit.metadata['exchange_rate'].to_f
        rate = FixerService.get_rate('USD', 'NGN') if rate.zero?
        [(data['amount'].to_f / rate), deposit.amount].min
      when 'plisio'
        # Plisio: 'source_amount' is the fiat amount (USD)
        data['source_amount'].to_f
      when 'hundredpay'
        # 100Pay billing amounts are in USD (unless specified otherwise, but we use USD)
        data['amount'].to_f
      when 'heleket'
        data['amount'].to_f
      else
        data['amount'].to_f # Plisio uses source_amount for fiat, but we handle that elsewhere or assume crypto
      end

    # Allow a small tolerance (±1%) for floating-point / FX rounding
    if paid_amount_usd < (deposit.amount * 0.99)
      Rails.logger.warn(
        "Deposit #{reference} failed amount validation. " \
        "Expected ~#{deposit.amount} USD, got #{paid_amount_usd} USD (gateway raw: #{data['amount']})"
      )
      return
    end

    ActiveRecord::Base.transaction do
      deposit.update!(status: 'completed', completed_at: Time.current)

      wallet = deposit.depositable.wallet
      raise "Wallet missing for #{deposit.depositable_type} #{deposit.depositable_id}" if wallet.nil?

      # Create a Transaction record for the deposit so it shows in SuperAdmin
      transaction = Transaction.create!(
        transactable: deposit.depositable,
        reference: deposit,
        amount: paid_amount_usd,
        transaction_type: 'credit',
        status: 'success',
        currency: 'USD',
        payment_gateway: gateway,
        description: "Deposit via #{gateway}",
        metadata: {
          gateway: gateway,
          gateway_ref: reference,
          paid_amount_usd: paid_amount_usd
        }
      )

      wallet.credit!(
        paid_amount_usd,
        "Deposit via #{gateway}",
        {
          gateway: gateway,
          gateway_ref: reference,
          paid_amount_usd: paid_amount_usd
        },
        transaction
      )
    end
  end

  def handle_order_payment(reference, _data, _gateway, metadata)
    # Recover the order id from the reference. Prefer explicit metadata, then the
    # legacy `ORD_<uuid>_<rand>` form, then the alphanumeric `ORD<uuid32><rand>`
    # form (32 hex digits — a valid Postgres uuid even without hyphens).
    order_id = metadata['order_id']
    order_id ||= reference.to_s.split('_')[1] if reference.to_s.include?('_')
    order_id ||= reference.to_s[/\AORD([0-9a-fA-F]{32})/, 1]
    order = Order.find_by(id: order_id)
    return unless order && (order.pending? || order.awaiting_payment?)

    # Provision in the background — provider IP assignment can take minutes and
    # would otherwise block the gateway webhook past its timeout (causing retries).
    actor = order.user || order.reseller
    return unless actor

    OrderProvisioningJob.perform_later(order.id, actor.id, actor.class.name)
  rescue StandardError => e
    Rails.logger.error("Order payment processing failed: #{e.message}")
    order&.update(status: 'failed')
  end

  def handle_checkout_session(reference, data, gateway, _metadata)
    session = CheckoutSession.find_by(gateway_reference: reference)
    return unless session&.pending?

    Rails.logger.info("[Reconcile] Processing checkout session #{session.id} via #{gateway}")

    ActiveRecord::Base.transaction do
      # Capture gateway tokens for recurring billing
      # (RexPay has no token-recharge API, so nothing to capture for it.)
      if gateway == 'fastspring'
        # Extract subscription ID from the first item if available
        # Webhook 'order.completed' data structure: data -> items -> [ { subscription: "..." }, ... ]
        raw_fs = data['raw_data'] || data
        sub_id = raw_fs.dig('items', 0, 'subscription')
        session.metadata['fastspring_sub_id'] = sub_id if sub_id
      end

      session.mark_paid!

      Transaction.create!(
        transactable: session.orderable,
        reference: session,
        amount: session.total_amount,
        transaction_type: 'debit',
        status: 'success',
        currency: session.currency,
        payment_gateway: gateway,
        description: "Cart Checkout via #{gateway}",
        metadata: { checkout_session_id: session.id, gateway: gateway }
      )
    end

    session.provision_orders!

    Rails.logger.info("[Reconcile] Checkout session #{session.id} completed")
  rescue StandardError => e
    Rails.logger.error("[Reconcile] Checkout session processing failed: #{e.message}")
    session&.fail! if session&.may_fail?
  end
end

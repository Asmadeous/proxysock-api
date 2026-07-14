# frozen_string_literal: true

require 'digest'
require 'base64'

class WebhooksController < ApplicationController
  def rexpay
    # RexPay hits the callbackUrl (user redirect and/or server notification)
    # without a documented signature, so the payload is never trusted — the
    # charge is confirmed server-side via getTransactionStatus before crediting.
    data =
      begin
        JSON.parse(request.raw_post)
      rescue StandardError
        {}
      end
    data = params.to_unsafe_h.except('controller', 'action', 'format').merge(data)

    reference = data['reference'] || data['paymentReference'] || data['transactionReference']

    if reference.blank?
      Rails.logger.warn('[Webhook] RexPay: missing transaction reference in payload')
      return rexpay_respond(:bad_request, reference)
    end

    verification = RexpayService.new.verify_transaction(reference)

    if verification[:status] == 'success'
      handle_payment(
        {
          'reference' => reference,
          'amount' => verification[:amount],
          'currency' => verification[:currency],
          'metadata' => data['metadata'] || {}
        },
        'rexpay'
      )
    else
      Rails.logger.info("[Webhook] RexPay: payment #{reference} not successful yet (#{verification[:error]})")
    end

    rexpay_respond(:ok, reference)
  end

  def plisio
    # Plisio (with `json=true` on the callback URL) POSTs the invoice update as a JSON body
    # with a `verify_hash` field. Verification (Plisio docs, Node example): take the raw JSON,
    # remove verify_hash, re-encode the REMAINING fields in their received order (NO sorting),
    # then HMAC-SHA1 with the secret key. We must work from the raw body, not Rails `params`,
    # because params stringify values and can change ordering.
    data =
      begin
        JSON.parse(request.raw_post)
      rescue StandardError
        params.to_unsafe_h.except('controller', 'action', 'format')
      end

    received_hash = data['verify_hash']

    if ENV['PLISIO_SECRET_KEY'].present? && received_hash.present?
      payload = JSON.generate(data.except('verify_hash'))
      expected = OpenSSL::HMAC.hexdigest('SHA1', ENV['PLISIO_SECRET_KEY'], payload)

      unless Rack::Utils.secure_compare(expected, received_hash.to_s)
        Rails.logger.warn("[Webhook] Plisio verify_hash mismatch — rejecting. Expected: #{expected}, Got: #{received_hash}")
        return head :bad_request
      end
    end

    handle_payment(data, 'plisio') if data['status'] == 'completed'
    head :ok
  end

  def heleket
    # Heleket (a Cryptomus rebrand) POSTs the payment update as a JSON body that
    # carries a `sign` field = md5(base64(json_without_sign) + PAYMENT_API_KEY).
    # It does NOT send a signature header. Work from the raw body so values and
    # key ordering are preserved (Rails params stringify/re-order).
    data =
      begin
        JSON.parse(request.raw_post)
      rescue StandardError
        {}
      end

    api_key = ENV['HELEKET_PAYMENT_API_KEY'] || ENV['HELEKET_API_KEY']
    received_sign = data['sign']

    if api_key.present? && received_sign.present?
      body_for_sign = data.except('sign')
      # Cryptomus signs PHP's json_encode output, which escapes forward slashes
      # (`/` -> `\/`); Ruby's JSON leaves them unescaped. Accept either variant —
      # both require knowledge of the secret API key, so neither is forgeable.
      candidates = [
        JSON.generate(body_for_sign),
        JSON.generate(body_for_sign).gsub('/') { '\\/' }
      ].map { |json| Digest::MD5.hexdigest(Base64.strict_encode64(json) + api_key) }

      unless candidates.any? { |c| Rack::Utils.secure_compare(c, received_sign.to_s) }
        Rails.logger.warn("[Webhook] Heleket sign mismatch — rejecting. Expected one of: #{candidates}, Got: #{received_sign}")
        return head :bad_request
      end
    end

    # Heleket success statuses: `paid` (exact) and `paid_over` (overpaid).
    if %w[paid paid_over completed].include?(data['status'].to_s.downcase)
      # Cryptomus echoes our reference back as `order_id`; `uuid` is its own id.
      reference = data['order_id'] || data['uuid']
      handle_payment(
        {
          'reference' => reference,
          'order_number' => reference,
          'status' => data['status'],
          'amount' => data['amount'],
          'currency' => data['currency']
        },
        'heleket'
      )
    end

    head :ok
  end

  def hundredpay
    # We'll use the chargeId to verify the transaction status server-side for security.
    data = params.to_unsafe_h
    charge_id = data['chargeId'] || data['id'] || data.dig('data', 'chargeId')

    unless charge_id
      Rails.logger.warn('[Webhook] 100Pay: Missing chargeId in payload')
      return head :bad_request
    end

    # Server-side verification to confirm status
    verification = HundredpayService.new.verify_transaction(charge_id)

    if verification[:status] == 'success'
      # 100Pay metadata may contain order_number/reference or we use ref_id
      reference = data['ref_id'] || data.dig('data', 'charge', 'ref_id') || charge_id

      # Prepare data for handle_payment
      payment_data = {
        'reference' => reference,
        'amount' => verification[:amount],
        'currency' => verification[:currency],
        'metadata' => data['metadata'] || data.dig('data', 'charge', 'metadata') || {}
      }

      handle_payment(payment_data, 'hundredpay')
    else
      Rails.logger.info("[Webhook] 100Pay: Payment not success yet (status: #{verification[:internal_status]})")
    end
    head :ok
  end

  def fastspring
    payload = request.raw_post
    signature = request.headers['X-FS-Signature']
    secret = ENV['FASTSPRING_WEBHOOK_SECRET']

    if secret.present? && signature.present?
      expected = Base64.strict_encode64(OpenSSL::HMAC.digest('sha256', secret, payload))
      unless Rack::Utils.secure_compare(expected, signature)
        Rails.logger.warn('[Webhook] FastSpring signature mismatch — rejecting')
        return head :unauthorized
      end
    end

    data = begin
      JSON.parse(payload)
    rescue StandardError
      {}
    end
    events = data['events'] || []

    events.each do |event|
      next unless event['type'] == 'order.completed'

      fs_data = event['data']
      # Extract tags from the session/order if present
      metadata = fs_data['tags'] || {}

      # Determine reference from tags or product path (e.g. checkout-xyz)
      reference = metadata['reference']
      if reference.nil? && fs_data['items'].present?
        product_path = fs_data['items'].first['product'].to_s
        if product_path.start_with?('checkout-')
          reference = product_path.sub('checkout-', '').upcase
        end
      end

      payment_data = {
        'reference' => reference,
        'amount' => fs_data['total'],
        'currency' => fs_data['currency'],
        'metadata' => metadata.merge('fastspring_order_id' => fs_data['order']),
        'raw_data' => fs_data # Pass raw data to handle_payment for token extraction
      }

      handle_payment(payment_data, 'fastspring')
    end

    head :ok
  end

  private

  # Browser GETs (the payer returning from RexPay) are forwarded to the frontend
  # success page; server-to-server POSTs get a plain status.
  def rexpay_respond(status, reference = nil)
    return head(status) unless request.get? || request.head?

    redirect_to(rexpay_success_url(reference), allow_other_host: true)
  end

  # Rebuild the frontend success URL from the paid record, so the callbackUrl we
  # send to RexPay can stay clean (no nested query string). Only ever redirects
  # to our own FRONTEND_URL, so there is no open-redirect surface.
  def rexpay_success_url(reference)
    frontend = ENV['FRONTEND_URL'].to_s.presence || '/'
    return frontend if reference.blank?

    base = "#{frontend}/payments/success?payment=rexpay"
    case reference.to_s
    when /\ACHECKOUT/
      session = CheckoutSession.find_by(gateway_reference: reference)
      session ? "#{base}&type=cart_checkout&checkout_session_id=#{session.id}&amount=#{session.total_amount}" : frontend
    when /\ADEP/
      deposit = Deposit.where("metadata->>'transaction_ref' = ?", reference).first
      deposit ? "#{base}&type=deposit&amount=#{deposit.amount}" : frontend
    when /\AORD/
      order = Order.find_by(id: reference.to_s[/\AORD([0-9a-fA-F]{32})/, 1])
      order ? "#{base}&type=order&order_id=#{order.id}&amount=#{order.total_amount}" : frontend
    else
      frontend
    end
  end

  def handle_payment(data, gateway)
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

    Rails.logger.info("[Webhook] Processing checkout session #{session.id} via #{gateway}")

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

    Rails.logger.info("[Webhook] Checkout session #{session.id} completed")
  rescue StandardError => e
    Rails.logger.error("[Webhook] Checkout session processing failed: #{e.message}")
    session&.fail! if session&.may_fail?
  end
end

# frozen_string_literal: true

class WebhooksController < ApplicationController
  def paystack
    payload = request.body.read
    signature = request.headers['x-paystack-signature']

    # Verify HMAC-SHA512 signature (Paystack docs)
    expected = OpenSSL::HMAC.hexdigest('SHA512', ENV['PAYSTACK_SECRET_KEY'], payload)
    return head :bad_request unless Rack::Utils.secure_compare(expected, signature.to_s)

    event = JSON.parse(payload)
    if event['event'] == 'charge.success'
      # Pass full data to handle_payment to allow token extraction
      handle_payment(event['data'], 'paystack')
    end
    head :ok
  end

  def plisio
    # Plisio sends callback data as POST with a verify_hash field.
    # Verification: remove verify_hash, sort remaining params by key,
    # JSON-encode them, then HMAC-SHA1 with your API secret key.
    # Callback URL must have ?json=true appended for JSON format.
    received_hash = params[:verify_hash]

    if ENV['PLISIO_SECRET_KEY'].present? && received_hash.present?
      # Build the data hash excluding verify_hash and Rails internal params
      callback_data = params.to_unsafe_h.except('verify_hash', 'controller', 'action', 'format')

      # Sort by key alphabetically and JSON-encode (must be compact JSON, no spaces)
      sorted_data = JSON.generate(callback_data.sort.to_h)

      # HMAC-SHA1 with secret key
      expected = OpenSSL::HMAC.hexdigest('SHA1', ENV['PLISIO_SECRET_KEY'], sorted_data)

      unless Rack::Utils.secure_compare(expected, received_hash.to_s)
        Rails.logger.warn("[Webhook] Plisio verify_hash mismatch — rejecting. Expected: #{expected}, Got: #{received_hash}")
        return head :bad_request
      end
    end

    webhook_params = params.permit(:status, :order_number, :order_name, :amount, :currency, :txn_id, :source_amount, :source_currency)
    handle_payment(webhook_params, 'plisio') if webhook_params[:status] == 'completed'
    head :ok
  end

  def payvra
    payload = request.body.read

    # Payvra webhook verification: HMAC-SHA512 of raw POST body
    # using Webhook Secret Key, sent in the "HMAC" HTTP header.
    # Docs: https://docs.payvra.com/webhook
    hmac_header = request.headers['HMAC'] || request.headers['HTTP_HMAC']

    if ENV['PAYVRA_WEBHOOK_SECRET'].present? && hmac_header.present?
      expected = OpenSSL::HMAC.hexdigest('SHA512', ENV['PAYVRA_WEBHOOK_SECRET'], payload)
      unless Rack::Utils.secure_compare(expected, hmac_header.to_s)
        Rails.logger.warn('[Webhook] Payvra HMAC signature mismatch — rejecting')
        return head :bad_request
      end
    end

    data = begin
      JSON.parse(payload)
    rescue StandardError
      {}
    end
    event_type = data['eventType']

    # Payvra sends eventType: PAYMENT_COMPLETED when payment is confirmed
    if event_type == 'PAYMENT_COMPLETED' || data['status'] == 'COMPLETED'
      webhook_params = ActionController::Parameters.new(data).permit(
        :status, :id, :amount, :amountCurrency, :eventType
      )
      # Map Payvra fields to our handle_payment format
      webhook_params[:order_number] = data.dig('metadata', 'order_number') || data['id']
      webhook_params[:reference] = data.dig('metadata', 'reference') || data['id']
      handle_payment(webhook_params, 'payvra')
    end

    head :ok
  end

  def hundredpay
    # 100Pay sends a POST with charge data.
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

  def handle_payment(data, gateway)
    reference = data['reference'] || data[:reference] || data['order_number'] || data[:order_number]
    return unless reference

    metadata = data['metadata'] || data[:metadata] || {}

    if reference.to_s.start_with?('CHECKOUT_')
      handle_checkout_session(reference, data, gateway, metadata)
    elsif reference.to_s.start_with?('DEP_')
      handle_deposit(reference, data, gateway)
    elsif reference.to_s.start_with?('ORD_') || metadata['type'] == 'order'
      handle_order_payment(reference, data, gateway, metadata)
    else
      handle_deposit(reference, data, gateway)
    end
  end

  def handle_deposit(reference, data, gateway)
    deposit = Deposit.where("metadata->>'transaction_ref' = ?", reference).first
    return unless deposit && deposit.status == 'pending'

    # Normalise the paid amount to USD.
    # Paystack amounts are in kobo (NGN × 100).  We stored deposit.amount in USD,
    # so we must convert: kobo → NGN → USD.
    paid_amount_usd =
      case gateway
      when 'paystack'
        paid_ngn       = data['amount'].to_f / 100.0 # kobo → NGN
        exchange_rate  = deposit.metadata['exchange_rate'].to_f
        exchange_rate  = FixerService.get_rate('USD', 'NGN') if exchange_rate.zero?
        paid_ngn / exchange_rate # NGN → USD
      when 'plisio'
        # Plisio: 'source_amount' is the fiat amount (USD)
        data['source_amount'].to_f
      when 'hundredpay'
        # 100Pay billing amounts are in USD (unless specified otherwise, but we use USD)
        data['amount'].to_f
      else
        data['amount'].to_f # Payvra — amounts already in USD
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
    order_id = metadata['order_id'] || reference.split('_')[1]
    order = Order.find_by(id: order_id)
    return unless order && (order.pending? || order.awaiting_payment?)

    ActiveRecord::Base.transaction do
      actor = order.user || order.reseller
      OrderProvisioningService.new(order, actor).process!
    end
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
      if gateway == 'paystack'
        auth_code = data.dig('authorization', 'authorization_code')
        session.metadata['paystack_auth_code'] = auth_code if auth_code
      elsif gateway == 'fastspring'
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

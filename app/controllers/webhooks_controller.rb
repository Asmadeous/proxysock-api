# frozen_string_literal: true

class WebhooksController < ApplicationController
  def paystack
    payload = request.body.read
    signature = request.headers['x-paystack-signature']

    # Verify HMAC-SHA512 signature (Paystack docs)
    expected = OpenSSL::HMAC.hexdigest('SHA512', ENV['PAYSTACK_SECRET_KEY'], payload)
    return head :bad_request unless Rack::Utils.secure_compare(expected, signature.to_s)

    event = JSON.parse(payload)
    handle_payment(event['data'], 'paystack') if event['event'] == 'charge.success'
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

      # Sort by key alphabetically and JSON-encode
      sorted_data = callback_data.sort.to_h.to_json

      # HMAC-SHA1 with secret key
      expected = OpenSSL::HMAC.hexdigest('SHA1', ENV['PLISIO_SECRET_KEY'], sorted_data)

      unless Rack::Utils.secure_compare(expected, received_hash.to_s)
        Rails.logger.warn("[Webhook] Plisio verify_hash mismatch — rejecting")
        return head :bad_request
      end
    end

    webhook_params = params.permit(:status, :order_number, :order_name, :amount, :currency, :txn_id)
    if webhook_params[:status] == 'completed'
      handle_payment(webhook_params, 'plisio')
    end
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
        Rails.logger.warn("[Webhook] Payvra HMAC signature mismatch — rejecting")
        return head :bad_request
      end
    end

    data = JSON.parse(payload) rescue {}
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

    paid_amount = gateway == 'paystack' ? (data['amount'].to_f / 100.0) : data['amount'].to_f

    if paid_amount < deposit.amount
      Rails.logger.warn("Deposit #{reference} failed amount validation. Expected #{deposit.amount}, got #{paid_amount}")
      return
    end

    ActiveRecord::Base.transaction do
      deposit.update!(status: 'completed', completed_at: Time.current)

      deposit.depositable&.wallet&.credit!(paid_amount, "Deposit via #{gateway}", {
                                             gateway: gateway,
                                             gateway_ref: reference,
                                             paid_amount: paid_amount
                                           })
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

  def handle_checkout_session(reference, _data, gateway, _metadata)
    session = CheckoutSession.find_by(gateway_reference: reference)
    return unless session && session.pending?

    Rails.logger.info("[Webhook] Processing checkout session #{session.id} via #{gateway}")

    ActiveRecord::Base.transaction do
      session.mark_paid!

      Transaction.create!(
        transactable: session.orderable,
        reference: session,
        amount: session.total_amount,
        transaction_type: 'debit',
        status: 'success',
        currency: session.currency,
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

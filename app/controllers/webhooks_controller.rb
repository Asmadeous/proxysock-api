# frozen_string_literal: true

class WebhooksController < ApplicationController
  def paystack
    payload = request.body.read
    signature = request.headers['x-paystack-signature']

    # Verify signature
    expected = OpenSSL::HMAC.hexdigest('SHA512', ENV['PAYSTACK_SECRET_KEY'], payload)
    return head :bad_request unless Rack::Utils.secure_compare(expected, signature.to_s)

    event = JSON.parse(payload)
    handle_payment(event['data'], 'paystack') if event['event'] == 'charge.success'
    head :ok
  end

  def plisio
    # Plisio webhook parameters
    webhook_params = params.permit(:status, :order_number, :order_name, :amount, :currency, :txn_id)
    # Only process if status is strictly completed. Mismatch or pending should be ignored for automated provisioning.
    if webhook_params[:status] == 'completed'
      handle_payment(webhook_params, 'plisio')
    end
    head :ok
  end

  def payvra
    # Payvra webhook parameters
    webhook_params = params.permit(:status, :order_number, :reference, :amount, :currency, :transaction_id, metadata: {})
    if webhook_params[:status] == 'success' || webhook_params[:status] == 'completed'
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
      # Cart checkout session
      handle_checkout_session(reference, data, gateway, metadata)
    elsif reference.to_s.start_with?('DEP_')
      # It's a deposit
      handle_deposit(reference, data, gateway)
    elsif reference.to_s.start_with?('ORD_') || metadata['type'] == 'order'
      # It's an order payment
      handle_order_payment(reference, data, gateway, metadata)
    else
      # Try deposit first
      handle_deposit(reference, data, gateway)
    end
  end

  def handle_deposit(reference, data, gateway)
    deposit = Deposit.where("metadata->>'transaction_ref' = ?", reference).first
    return unless deposit && deposit.status == 'pending'

    # Extract given amount considering gateway specific formats (Paystack is in kobo)
    paid_amount = gateway == 'paystack' ? (data['amount'].to_f / 100.0) : data['amount'].to_f

    # Strict amount validation to prevent partial payment exploits
    if paid_amount < deposit.amount
      Rails.logger.warn("Deposit #{reference} failed amount validation. Expected #{deposit.amount}, got #{paid_amount}")
      return
    end

    ActiveRecord::Base.transaction do
      deposit.update!(status: 'completed', completed_at: Time.current)

      # Credit wallet
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
    return unless order && order.status == 'pending'

    ActiveRecord::Base.transaction do
      # Mark as paid and provision
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

      # Create transaction record for the payment
      Transaction.create!(
        transactable: session.user,
        amount: session.total_amount,
        transaction_type: 'debit',
        status: 'success',
        currency: session.currency,
        description: "Cart Checkout via #{gateway}",
        metadata: { checkout_session_id: session.id, gateway: gateway }
      )
    end

    # Provision all orders (async-safe, outside transaction)
    session.provision_orders!

    Rails.logger.info("[Webhook] Checkout session #{session.id} completed")
  rescue StandardError => e
    Rails.logger.error("[Webhook] Checkout session processing failed: #{e.message}")
    session&.fail! if session&.may_fail?
  end
end

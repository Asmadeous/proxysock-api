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
    webhook_params = params.permit(:status, :order_number, :reference, :amount, :currency, :txn_id, metadata: {})
    handle_payment(webhook_params, 'plisio') if %w[completed mismatch].include?(webhook_params[:status])
    head :ok
  end

  def payvra
    webhook_params = params.permit(:status, :order_number, :reference, :amount, :currency, :transaction_id, metadata: {})
    handle_payment(webhook_params, 'payvra') if webhook_params[:status] == 'success'
    head :ok
  end

  private

  def handle_payment(data, gateway)
    reference = data['reference'] || data[:reference] || data['order_number'] || data[:order_number]
    return unless reference

    metadata = data['metadata'] || data[:metadata] || {}

    if reference.to_s.start_with?('DEP_')
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
    deposit = Deposit.find_by(transaction_id: reference)
    return unless deposit && deposit.status == 'pending'

    amount = gateway == 'paystack' ? (data['amount'].to_f / 100.0) : data['amount'].to_f

    ActiveRecord::Base.transaction do
      deposit.update!(status: 'completed', completed_at: Time.current)

      # Credit wallet
      deposit.depositable&.wallet&.credit!(amount, "Deposit via #{gateway}", {
                                             gateway: gateway,
                                             gateway_ref: reference
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
end

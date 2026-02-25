# frozen_string_literal: true

module Web
  module Api
    class WebhooksController < ApplicationController
      def paystack
        PaystackService.new
        payload = request.body.read
        signature = request.headers['x-paystack-signature']

        # Verify signature logic (hmac sha512 usually)
        if OpenSSL::HMAC.hexdigest('SHA512', ENV['PAYSTACK_SECRET_KEY'], payload) == signature
          event = JSON.parse(payload)
          handle_deposit(event['data'], 'paystack') if event['event'] == 'charge.success'
          head :ok
        else
          head :bad_request
        end
      end

      def plisio
        # Plisio sends form data usually or json
        webhook_params = params.permit(:status, :order_number, :reference, :amount, :currency, :txn_id)
        if %w[completed mismatch].include?(webhook_params[:status])
          # Verify secret/order logic
          handle_deposit(webhook_params, 'plisio')
        end
        head :ok
      end

      def payvra
        # Mock logic based on typical webhooks
        render json: { status: 'received' }
      end

      private

      def handle_deposit(data, gateway)
        reference = data['reference'] || data['order_number']
        return unless reference

        # Check if this reference belongs to a CheckoutSession first
        checkout_session = CheckoutSession.find_by(gateway_reference: reference)
        
        if checkout_session
          handle_checkout_session(checkout_session, data, gateway)
          return
        end

        # Fallback to Deposit
        deposit = Deposit.find_by(transaction_id: reference)
        return unless deposit&.pending?

        amount = gateway == 'paystack' ? (data['amount'] / 100.0) : data['amount']
        deposit.update!(status: 'completed', completed_at: Time.current)

        return unless deposit.depositable&.wallet

        deposit.depositable.wallet.credit!(amount, "Deposit via #{gateway}", { gateway_ref: reference })
      end

      def handle_checkout_session(session, data, gateway)
        return unless session.status == 'pending'

        amount = gateway == 'paystack' ? (data['amount'] / 100.0) : data['amount'].to_f
        
        ActiveRecord::Base.transaction do
          session.update!(status: 'completed')
          
          actor = session.orderable
          wallet = actor.wallet
          
          # Virtual deposit processing to keep ledger accurate:
          # Credit for the inbound gateway amount
          transaction_in = Transaction.create!(
            transactable: actor,
            amount: amount,
            transaction_type: 'credit',
            status: 'success',
            currency: 'USD',
            description: "Checkout Session Funding via #{gateway}"
          )
          wallet.credit!(amount, "Checkout via #{gateway}", { session_id: session.id }, transaction_in)
          
          # Debit for the total orders
          transaction_out = Transaction.create!(
            transactable: actor,
            amount: session.total_amount,
            transaction_type: 'debit',
            status: 'success',
            currency: 'USD',
            description: "Cart Checkout (#{session.orders.count} items)"
          )
          wallet.debit!(session.total_amount, 'Cart Checkout Payment', { session_id: session.id }, transaction_out)

          # Provision all orders
          session.orders.each do |order|
            OrderProvisioningService.new(order, actor).process_without_deduction!
          end
        end
      rescue StandardError => e
        Rails.logger.error("Checkout Session Webhook Failed: #{e.message}")
        session.update!(status: 'failed') rescue nil
      end
    end
  end
end

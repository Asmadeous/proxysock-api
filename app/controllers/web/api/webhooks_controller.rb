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
        params.permit!
        if %w[completed mismatch].include?(params[:status])
          # Verify secret/order logic
          handle_deposit(params, 'plisio')
        end
        head :ok
      end

      def payvra
        # Mock logic based on typical webhooks
        render json: { status: 'received' }
      end

      private

      def handle_deposit(data, gateway)
        # Find deposit by reference
        reference = data['reference'] || data['order_number']
        return unless reference

        deposit = Deposit.find_by(transaction_id: reference)

        return unless deposit&.pending?

        amount = gateway == 'paystack' ? (data['amount'] / 100.0) : data['amount']

        deposit.update!(status: 'completed', completed_at: Time.current)

        # Credit Wallet (using polymorphic owner/depositable)
        return unless deposit.depositable&.wallet

        deposit.depositable.wallet.credit!(amount, "Deposit via #{gateway}", { gateway_ref: reference })
      end
    end
  end
end

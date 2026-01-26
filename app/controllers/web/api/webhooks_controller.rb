module Web
  module Api
    class WebhooksController < ApplicationController
      
      def paystack
        service = PaystackService.new
        payload = request.body.read
        signature = request.headers['x-paystack-signature']
        
        # Verify signature logic (hmac sha512 usually)
        if OpenSSL::HMAC.hexdigest('SHA512', ENV['PAYSTACK_SECRET_KEY'], payload) == signature
          event = JSON.parse(payload)
          if event['event'] == 'charge.success'
            handle_deposit(event['data'], 'paystack')
          end
          head :ok
        else
          head :bad_request
        end
      end

      def plisio
        # Plisio sends form data usually or json
        params.permit!
        if params[:status] == 'completed' || params[:status] == 'mismatch'
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
        
        if deposit && deposit.pending?
           amount = gateway == 'paystack' ? (data['amount'] / 100.0) : data['amount']
           
           deposit.update!(status: 'completed', completed_at: Time.current)
           
           # Credit Wallet (using polymorphic owner/depositable)
           if deposit.depositable && deposit.depositable.wallet
             deposit.depositable.wallet.credit!(amount, "Deposit via #{gateway}", { gateway_ref: reference })
           end
        end
      end
    end
  end
end

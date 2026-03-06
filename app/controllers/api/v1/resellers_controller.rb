# frozen_string_literal: true

module Api
  module V1
    class ResellersController < BaseController
      include JwtAuthenticated

      def show
        render json: current_reseller
      end

      def update
        if current_reseller.update(reseller_params)
          render json: current_reseller
        else
          render json: { errors: current_reseller.errors }, status: :unprocessable_entity
        end
      end

      def deposit
        amount = params[:amount].to_f
        gateway = params[:gateway]
        currency = params[:currency] || 'USD'

        return render json: { error: 'Minimum deposit for resellers is $1000' }, status: :bad_request if amount < 1000
        return render json: { error: 'Invalid gateway' }, status: :bad_request unless %w[paystack plisio
                                                                                         payvra].include?(gateway)

        # Create Pending Deposit
        transaction_ref = "DEP_#{SecureRandom.hex(8)}"
        deposit = Deposit.create!(
          depositable: current_reseller,
          amount: amount,
          gateway: gateway,
          status: 'pending',
          metadata: { transaction_ref: transaction_ref }
        )

        payment_url = generate_payment_link(gateway, deposit, amount, currency)

        render json: {
          message: 'Deposit initiated',
          deposit_id: deposit.id,
          transaction_ref: deposit.metadata['transaction_ref'],
          payment_url: payment_url
        }
      end

      private

      def generate_payment_link(gateway, deposit, amount, currency)
        callback_url = "#{ENV['APP_URL']}/webhooks/#{gateway}"

        case gateway
        when 'paystack'
          exchange_rate = 1500 # NGN/USD
          amount_ngn = amount * exchange_rate
          service = PaystackService.new
          result = service.initialize_transaction(
            email: current_reseller.email,
            amount: (amount_ngn * 100).to_i,
            reference: deposit.metadata['transaction_ref'],
            callback_url: callback_url,
            metadata: { deposit_id: deposit.id, reseller_id: current_reseller.id }
          )
          result[:authorization_url]
        when 'plisio'
          service = PlisioService.new
          result = service.create_invoice(
            amount,
            currency,
            deposit.metadata['transaction_ref']
          )
          result[:url]
        when 'payvra'
          service = PayvraService.new
          service.create_charge(
            amount,
            currency
          )
          # NOTE: Payvra requires tracking its own return reference if applicable

        end
      end

      def reseller_params
        params.require(:reseller).permit(:company_name, :email, :profile_picture_url)
      end
    end
  end
end

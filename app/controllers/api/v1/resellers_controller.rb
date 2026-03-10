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

        payment_data = generate_payment_link(gateway, deposit, amount, currency)

        render json: {
          message: 'Deposit initiated',
          deposit_id: deposit.id,
          transaction_ref: deposit.metadata['transaction_ref'],
          payment_url: payment_data[:url],
          payment_amount: payment_data[:amount],
          payment_currency: payment_data[:currency]
        }
      end

      private

      def generate_payment_link(gateway, deposit, amount, currency)
        callback_url = "#{ENV['APP_URL']}/webhooks/#{gateway}"

        case gateway
        when 'paystack'
          exchange_rate = FixerService.get_rate('USD', 'NGN')
          amount_ngn = (amount * exchange_rate).round(2)
          service = PaystackService.new
          result = service.initialize_transaction(
            email: current_reseller.email,
            amount: (amount_ngn * 100).to_i,
            reference: deposit.metadata['transaction_ref'],
            callback_url: callback_url,
            metadata: { deposit_id: deposit.id, reseller_id: current_reseller.id }
          )
          { url: result[:authorization_url], amount: amount_ngn, currency: 'NGN' }
        when 'plisio'
          service = PlisioService.new
          result = service.create_invoice(
            amount: amount,
            currency: currency,
            order_number: deposit.metadata['transaction_ref'],
            callback_url: callback_url,
            email: current_reseller.email
          )
          { url: result[:url], amount: amount, currency: 'USD' }
        when 'payvra'
          service = PayvraService.new
          result = service.create_invoice(
            amount: amount,
            currency: currency,
            order_number: deposit.metadata['transaction_ref'],
            callback_url: callback_url,
            email: current_reseller.email
          )
          # Store Payvra's txn_id so DepositSyncService can verify it later.
          deposit.metadata['payvra_invoice_id'] = result[:txn_id]
          deposit.save!
          { url: result[:url], amount: amount, currency: 'USD' }
        end
      end

      def reseller_params
        params.require(:reseller).permit(:company_name, :email, :profile_picture_url)
      end
    end
  end
end

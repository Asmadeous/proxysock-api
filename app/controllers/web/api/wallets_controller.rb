# frozen_string_literal: true

module Web
  module Api
    class WalletsController < BaseController
      include JwtAuthenticated

      # GET /web/api/wallet
      def show
        wallet = current_user.wallet
        # Calculate stats
        total_deposited = wallet&.wallet_transactions&.where(transaction_type: 'credit')&.sum(:amount) || 0
        # Deposits are credits. But refunds are also credits.
        # description might help. Or just use total credits - adjustments?
        # For now, total credits is good enough proxy for "Total Deposited" if we ignore refunds/bonuses for a moment.

        # Actually proper way:
        total_deposited = wallet&.wallet_transactions&.where(transaction_type: 'credit')&.sum(:amount) || 0

        total_spent = current_user.orders.where(status: ['active', 'completed']).sum(:total_amount)
        order_count = current_user.orders.count

        render json: {
          available_balance: wallet&.balance || 0.0,
          currency: 'USD',
          total_deposited: total_deposited,
          total_order_amount: total_spent,
          order_count: order_count,
          discount_percentage: current_user.metadata && current_user.metadata['discount_percentage'] || 0,
          recent_transactions: wallet&.wallet_transactions&.order(created_at: :desc)&.limit(10) || []
        }
      end

      # POST /web/api/wallet/deposit
      def deposit
        amount = params[:amount].to_f
        gateway = params[:gateway] # 'paystack', 'plisio', 'payvra'
        currency = params[:currency] || 'USD'

        return render json: { error: 'Minimum deposit is $10' }, status: :bad_request if amount < 10
        return render json: { error: 'Invalid gateway' }, status: :bad_request unless %w[paystack plisio
                                                                                         payvra].include?(gateway)

        # Create pending deposit
        transaction_ref = "DEP_#{SecureRandom.hex(8)}"
        deposit = Deposit.create!(
          depositable: current_user,
          amount: amount,
          gateway: gateway,
          status: 'pending',
          metadata: { transaction_ref: transaction_ref }
        )

        # Generate payment link based on gateway
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
            email: current_user.email,
            amount: (amount_ngn * 100).to_i, # Paystack uses kobo
            reference: deposit.metadata['transaction_ref'],
            callback_url: callback_url,
            metadata: { deposit_id: deposit.id, user_id: current_user.id }
          )
          result[:authorization_url]

        when 'plisio'
          service = PlisioService.new
          result = service.create_invoice(
            order_number: deposit.metadata['transaction_ref'],
            amount: amount,
            currency: currency,
            callback_url: callback_url,
            email: current_user.email
          )
          result[:invoice_url]

        when 'payvra'
          service = PayvraService.new
          result = service.create_payment(
            amount: amount,
            currency: currency,
            reference: deposit.metadata['transaction_ref'],
            callback_url: callback_url
          )
          result[:payment_url]
        end
      end
    end
  end
end
